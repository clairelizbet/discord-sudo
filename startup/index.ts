import 'dotenv/config'
import { commands } from '../commands'
import {
  connectDiscord,
  syncCommands,
  getGuildAdminRole,
  removeGuildUserRole,
  getDiscordClient,
} from '../discord'
import { connectDatabase } from '../database'
import { DiscordAPIError } from 'discord.js'

async function initialize(): Promise<void> {
  const discordClient = await connectDiscord()
  const db = await connectDatabase()
  const authorizations = await db.fetchAllAuthorizations()
  const dbCleanupOperations: Promise<string | void>[] = []

  authorizations.forEach((authorization) => {
    const { userId, guildId } = authorization
    const adminRoleResolvable = getGuildAdminRole(guildId)

    if (authorization.isExpired()) {
      dbCleanupOperations.push(
        adminRoleResolvable
          .then((adminRole) => removeGuildUserRole(guildId, userId, adminRole))
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

      setTimeout(() => {
        try {
          adminRoleResolvable
            .then((adminRole) =>
              removeGuildUserRole(guildId, userId, adminRole)
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
      }, Math.max(remainingMilliseconds, 0))
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