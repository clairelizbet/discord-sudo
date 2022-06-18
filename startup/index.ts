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

async function initialize(): Promise<void> {
  const discordClient = await connectDiscord()
  const db = await connectDatabase()
  const authorizations = await db.fetchAllAuthorizations()
  const dbCleanupOperations: Promise<string | undefined>[] = []

  authorizations.forEach((authorization) => {
    if (authorization.isExpired()) {
      const { userId, guildId } = authorization
      dbCleanupOperations.push(
        getGuildAdminRole(guildId)
          .then((adminRole) => removeGuildUserRole(guildId, userId, adminRole))
          .then(() => db.removeAuthorization(userId, guildId))
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
