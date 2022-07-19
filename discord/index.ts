import { REST } from '@discordjs/rest'
import { APIUser, PermissionFlagsBits, Snowflake } from 'discord-api-types/v9'
import {
  ApplicationCommand,
  Client,
  Collection,
  Guild,
  GuildMember,
  GatewayIntentBits,
  Role,
  User,
} from 'discord.js'
import { BotCommand } from '../commands/base'
import { getDatabase } from '../database'

let discordClient: Client
let discordREST: REST

async function connectDiscord(): Promise<Client> {
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? ''
  const CLIENT_TOKEN = process.env.DISCORD_CLIENT_SECRET ?? ''

  if (!CLIENT_ID)
    throw new Error(
      'DISCORD_CLIENT_ID was not found in the environment or .env file'
    )
  if (!CLIENT_TOKEN)
    throw new Error(
      'DISCORD_CLIENT_SECRET was not found in the environment or .env file'
    )

  return new Promise((resolve, reject) => {
    const rejectConnection = (error: Error) => reject(error)
    const resolveConnection = () => {
      if (discordClient.user)
        discordClient.removeListener('ready', resolveConnection)
      discordClient.removeListener('error', rejectConnection)

      resolve(discordClient)
    }

    discordClient = new Client({ intents: [GatewayIntentBits.Guilds] })
    discordREST = new REST({ version: '9' }).setToken(CLIENT_TOKEN)

    discordClient.addListener('ready', resolveConnection)
    discordClient.addListener('error', rejectConnection)

    discordClient.login(CLIENT_TOKEN)
  })
}

function getDiscordClient(): Client {
  if (!discordClient)
    throw new Error(
      'Attempted to access Discord client prior to initialization'
    )

  return discordClient
}

function getDiscordREST(): REST {
  if (!discordREST)
    throw new Error(
      'Attempted to access Discord REST provider prior to initialization'
    )

  return discordREST
}

async function syncCommands(commands: BotCommand[]): Promise<void> {
  if (process.env.DEBUG_SKIP_COMMAND_SYNC?.toLowerCase().trim() === 'true') {
    return
  }

  const cloudCommands: Collection<Snowflake, ApplicationCommand> | undefined =
    await discordClient.application?.commands.fetch()

  if (!cloudCommands || cloudCommands.size === 0) {
    await discordClient.application?.commands
      .set(commands.map((cmd) => cmd.getData()))
      .then((syncedCommands) => {
        syncedCommands.forEach((syncedCommand) => {
          const command = commands.find(
            (cmd) => cmd.name === syncedCommand.name
          )

          if (command)
            getDatabase().registerCommandVersion(command, syncedCommand.version)
        })
      })
  } else {
    // Upload new commands that are local to the Discord cloud
    await Promise.all(
      commands.map((localCommand) => {
        const cloudCommand = cloudCommands.find(
          (cmd) => cmd.name === localCommand.name
        )

        if (!cloudCommand) {
          return discordClient
            .application!.commands.create(localCommand.getData())
            .then((syncedCommand) =>
              getDatabase().registerCommandVersion(
                localCommand,
                syncedCommand.version
              )
            )
        }

        return Promise.resolve(localCommand)
      })
    )

    // Delete commands that no longer exist and update existing
    await Promise.all(
      cloudCommands.map(
        (
          cloudCommand: ApplicationCommand
        ): Promise<ApplicationCommand | string> => {
          const localCommand = commands.find(
            (cmd) => cmd.name === cloudCommand.name
          )

          if (!localCommand) {
            return discordClient
              .application!.commands.delete(cloudCommand)
              .then((deletedRecord) => deletedRecord ?? cloudCommand)
          }

          return getDatabase()
            .fetchCommandVersion(localCommand)
            .then((localVersion): Promise<ApplicationCommand> => {
              if (cloudCommand.version !== localVersion) {
                return discordClient.application!.commands.edit(
                  cloudCommand,
                  localCommand.getData()
                )
              } else {
                return Promise.resolve(cloudCommand)
              }
            })
            .then((syncedCommand: ApplicationCommand) => {
              return getDatabase().registerCommandVersion(
                localCommand,
                syncedCommand.version
              )
            })
        }
      )
    )
  }

  return
}

async function resolveGuild(guild: Guild | Snowflake): Promise<Guild> {
  let targetGuild: Guild

  if (typeof guild === 'string') {
    targetGuild = await discordClient.guilds.fetch(guild)
  } else {
    targetGuild = guild
  }

  return targetGuild
}

async function resolveGuildMember(
  guildMember: Guild | Snowflake | GuildMember,
  ...args: any[]
): Promise<GuildMember>

async function resolveGuildMember(
  guild: Guild | Snowflake,
  user: User | Snowflake
): Promise<GuildMember>

async function resolveGuildMember(
  guildOrMember: Guild | Snowflake | GuildMember,
  user?: User | Snowflake
): Promise<GuildMember> {
  if (
    typeof guildOrMember === 'object' &&
    guildOrMember.hasOwnProperty('guild')
  ) {
    return guildOrMember as GuildMember
  }

  const targetGuild = await resolveGuild(guildOrMember as Guild | Snowflake)
  return await targetGuild.members.fetch(user!)
}

async function getGuildAdminRole(guild: Guild | Snowflake): Promise<Role> {
  type WeightdRole = { weight: number; role: Role }

  const targetGuild = await resolveGuild(guild)

  const storedRoleId = await getDatabase().fetchGuildAdminRole(guild)
  let storedRole: Role | null | undefined
  if (storedRoleId) storedRole = await targetGuild.roles.fetch(storedRoleId)

  // If the configured role exists but we can't manage it, throw an Error
  if (storedRole && !storedRole.editable)
    throw new Error(
      `The bot doesn't have permission to manage <@&${storedRole.id}>. Please ensure the "sudo" role is placed above it and has the "Manage Roles" permission.`
    )

  // If the configured role exists and we can manage it, use that!
  if (storedRole?.editable) return storedRole

  const allRoles = await targetGuild.roles.fetch()
  const weightedRoles: WeightdRole[] = []

  allRoles
    // Role MUST have admin privs
    .filter((role) => role.permissions.has(PermissionFlagsBits.Administrator))
    .map((role) => {
      let weight = 1

      const { name, permissions } = role
      const { Administrator: AdministratorBits } = PermissionFlagsBits

      const preferredRoleName = 'admin'
      const normalizedRoleName = name.normalize().toLowerCase().trim()

      // Prefer clearly named admin roles
      if (normalizedRoleName.startsWith(preferredRoleName)) weight += 1
      if (normalizedRoleName.includes(preferredRoleName)) weight += 1

      // Prefer roles with only the admin privilege and no others
      if (permissions.bitfield === AdministratorBits) weight += 1

      weightedRoles.push({ weight, role })
    })

  // Get roles in ascending weighted order and choose the highest ranked one
  const adminRoles = weightedRoles.sort(
    (roleA: WeightdRole, roleB: WeightdRole) => {
      if (roleA.weight < roleB.weight) return -1
      if (roleA.weight > roleB.weight) return 1
      return 0
    }
  )

  // We MUST be able to manage the role
  const editableAdminRole = adminRoles
    .filter((weightedRole) => weightedRole.role.editable)
    .pop()

  if (!editableAdminRole && adminRoles.length > 0)
    throw new Error(
      'The bot doesn\'t have permission to manage the admin role. Please ensure the "sudo" role is placed above the admin role and has the "Manage Roles" permission.'
    )

  if (!editableAdminRole) throw new Error('No admin roles found')

  return editableAdminRole.role
}

async function grantGuildUserRoles(
  member: GuildMember,
  roles: Role | Collection<string, Role>
): Promise<GuildMember>

async function grantGuildUserRoles(
  guild: Guild | Snowflake,
  user: User | Snowflake | APIUser,
  roles: Role | Collection<string, Role>
): Promise<GuildMember>

async function grantGuildUserRoles(
  guildOrMember: Guild | Snowflake | GuildMember,
  userOrRoles: User | Snowflake | APIUser | Role | Collection<string, Role>,
  roles?: Role | Collection<string, Role>
): Promise<GuildMember> {
  const guildMember = await resolveGuildMember(guildOrMember, userOrRoles)
  return await guildMember.roles.add(roles ?? (userOrRoles as Role))
}

async function removeGuildUserRoles(
  guild: Guild | Snowflake,
  user: GuildMember | User | APIUser | Snowflake,
  roles: Role | Collection<string, Role>,
  reason?: string
): Promise<GuildMember> {
  const guildMember = await resolveGuildMember(guild, user)
  return await guildMember.roles.remove(roles, reason)
}

export { connectDiscord, syncCommands, getGuildAdminRole }
export { grantGuildUserRoles, removeGuildUserRoles }
export { resolveGuildMember }
export { getDiscordClient, getDiscordREST }
