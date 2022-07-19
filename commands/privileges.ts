import { ChatInputCommandInteraction } from 'discord.js'
import { removeGuildUserRoles } from '../discord'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} from 'discord-api-types/v9'
import { BaseBotCommand } from './base'
import { getDatabase } from '../database'
import { idForObject } from '../util/object'

class PrivilegesCommand extends BaseBotCommand {
  defaultUserPermissions: bigint
  acceptsDirectMessages: boolean

  constructor() {
    super('privileges')

    this.description = 'Immediately drops your admin access privileges'
    this.defaultUserPermissions = PermissionFlagsBits.Administrator
    this.acceptsDirectMessages = false

    this.options = [
      {
        name: 'drop',
        description: this.description,
        type: ApplicationCommandOptionType.Subcommand,
      },
    ]
  }

  async handleDrop(
    interaction: ChatInputCommandInteraction
  ): Promise<string | undefined> {
    const { guild } = interaction
    const activeCommandName = `${
      interaction.commandName
    } ${interaction.options.getSubcommand(false)}`

    if (!guild) {
      interaction.reply({
        content: `:warning: The ${activeCommandName} command only works in guild channels`,
        ephemeral: true,
      })
      return
    }

    const userId = idForObject(interaction.member?.user)

    if (!userId) {
      interaction.reply({
        content: `:warning: Unable to grant admin access - no guild member target`,
        ephemeral: true,
      })
      return
    }

    try {
      const userInfo = await guild.members.fetch(userId)
      const userAdminRoles = userInfo.roles.cache.filter((userRole) =>
        userRole.permissions.has(PermissionFlagsBits.Administrator)
      )
      await removeGuildUserRoles(
        guild,
        userId,
        userAdminRoles,
        'Privilege drop requested'
      )
      await getDatabase().removeAuthorization(userId, guild)

      interaction.reply({
        content: `:white_check_mark: Admin access privileges dropped`,
        ephemeral: true,
      })
    } catch (e) {
      interaction.reply({
        content: `:warning: Unable to drop admin access ${
          e instanceof Error ? `- ${e.message}` : ''
        }`,
        ephemeral: true,
      })
    }
  }

  async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    try {
      if (interaction.options.getSubcommand() === 'drop') {
        await this.handleDrop(interaction)
      } else {
        this.handleUnknownCommand(interaction)
      }
    } catch (e) {
      this.handleUnknownCommand(interaction)
    }

    return
  }
}

export { PrivilegesCommand }
