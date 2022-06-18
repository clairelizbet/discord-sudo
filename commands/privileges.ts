import { CommandInteraction } from 'discord.js'
import { getGuildAdminRole, removeGuildUserRole } from '../discord'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} from 'discord-api-types/v9'
import { BaseBotCommand } from './base'
import { getDatabase } from '../database'

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

  async handleUnknown(interaction: CommandInteraction): Promise<void> {
    interaction.reply({
      content: `:warning: Unknwon command`,
      ephemeral: true,
    })
    return
  }

  async handleDrop(
    interaction: CommandInteraction
  ): Promise<string | undefined> {
    const { guild } = interaction

    if (!guild) {
      interaction.reply({
        content: `:warning: The sudo command only works in guild channels`,
        ephemeral: true,
      })
      return
    }

    const user = interaction.isUserContextMenu()
      ? interaction.targetMember?.user
      : interaction.member?.user

    if (!user) {
      interaction.reply({
        content: `:warning: Unable to grant admin access - no guild member target`,
        ephemeral: true,
      })
      return
    }

    try {
      const adminRole = await getGuildAdminRole(guild)
      await removeGuildUserRole(guild, user, adminRole)
      await getDatabase().removeAuthorization(user.id, guild)

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

  async handleInteraction(interaction: CommandInteraction): Promise<void> {
    try {
      if (interaction.options.getSubcommand() === 'drop') {
        await this.handleDrop(interaction)
      } else {
        this.handleUnknown(interaction)
      }
    } catch (e) {
      this.handleUnknown(interaction)
    }

    return
  }
}

export { PrivilegesCommand }
