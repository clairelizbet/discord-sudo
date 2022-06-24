import { commands } from '../commands'
import {
  connectDiscord,
  syncCommands,
  removeGuildUserRoles,
  getDiscordClient,
} from '../discord'
import { connectDatabase } from '../database'
import { DiscordAPIError } from 'discord.js'
import { setTimer } from '../timers'

async function initialize(): Promise<void> {
  try {
    // Attempt to load config from .env
    await import('dotenv/config')
  } catch (e) {
    // In we're outside production, dev dependencies should be installed
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        "Couldn't load the dotenv module. Please check that dev dependencies are installed"
      )
    }
  }

  const discordClient = await connectDiscord()
  const db = await connectDatabase()
  const authorizations = await db.fetchAllAuthorizations()
  const dbCleanupOperations: Promise<string | void>[] = []

  authorizations.forEach((authorization) => {
    const { userId, guildId } = authorization
    const userAdminRolesResolvable = discordClient.guilds
      .fetch(guildId)
      .then((guild) => guild.members.fetch(userId))
      .then((userInfo) =>
        userInfo.roles.cache.filter((userRole) =>
          userRole.permissions.has('ADMINISTRATOR')
        )
      )

    if (authorization.isExpired()) {
      dbCleanupOperations.push(
        userAdminRolesResolvable
          .then((adminRoles) =>
            removeGuildUserRoles(guildId, userId, adminRoles)
          )
          .then(() => db.removeAuthorization(userId, guildId))
          .catch((err) => {
            if (!(err instanceof DiscordAPIError)) throw err

            // Bot lacks access (removed from guild or guild deleted)
            if (err.code === 50001) {
              db.removeAllGuildAuthorizations(guildId)
            } else {
              console.error(err)
            }
          })
      )
    } else {
      const remainingMilliseconds = authorization.millisecondsUntilExpiration()

      if (remainingMilliseconds < 0) {
        console.warn(
          'Reached non-expired logic block for expired authorization'
        )
      }

      setTimer(
        guildId,
        userId,
        () => {
          try {
            userAdminRolesResolvable
              .then((adminRoles) =>
                removeGuildUserRoles(guildId, userId, adminRoles)
              )
              .then(() => db.removeAuthorization(userId, guildId))
          } catch (err) {
            // Bot lacks access (removed from guild or guild deleted)
            if (err instanceof DiscordAPIError && err.code === 50001) {
              db.removeAllGuildAuthorizations(guildId)
            } else {
              console.error(err)
            }
          }
        },
        Math.max(remainingMilliseconds, 0)
      )
    }
  })

  discordClient.on('guildDelete', (guild) => {
    // If the bot is removed from a guild, clean up to db by removing any authorizations
    db.removeAllGuildAuthorizations(guild.id)
  })

  await Promise.all([...dbCleanupOperations, syncCommands(commands)])
  return
}

function attachCommandListeners() {
  const discordClient = getDiscordClient()

  discordClient.on('interactionCreate', (interaction) => {
    if (!interaction.isApplicationCommand()) return

    commands
      .find((cmd) => cmd.name === interaction.commandName)
      ?.handleInteraction(interaction)
  })
}

export { initialize, attachCommandListeners }
