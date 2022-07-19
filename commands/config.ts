import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} from 'discord-api-types/v9'
import { BaseBotCommand } from './base'
import { getDatabase } from '../database'

class ConfigCommand extends BaseBotCommand {
  defaultUserPermissions: bigint
  acceptsDirectMessages: boolean

  constructor() {
    super('sudo-config')

    this.description = 'Manage Sudo for Discord configuration'
    this.defaultUserPermissions = PermissionFlagsBits.Administrator
    this.acceptsDirectMessages = false

    this.options = [
      {
        name: 'set-admin-role',
        description: 'Sets the role assigned when granting admin',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: 'Admin role',
            type: ApplicationCommandOptionType.Role,
            required: true,
          },
        ],
      },
      {
        name: 'enable-admin-role-autoselect',
        description:
          'The bot will use any available admin role when granting admin (default)',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ]
  }

  async handleSetRole(
    interaction: CommandInteraction
  ): Promise<string | undefined> {
    const { guild } = interaction

    if (!guild) {
      interaction.reply({
        content: `:warning: The sudo-config command only works in guild channels`,
        ephemeral: true,
      })
      return
    }

    const roleId = interaction.options.get('role')?.value

    if (typeof roleId !== 'string' || !roleId) {
      interaction.reply({
        content: `:warning: Unable to find the role you requested`,
        ephemeral: true,
      })
      return
    }

    try {
      const role = await guild.roles.fetch(roleId)

      if (!role?.permissions.has(PermissionFlagsBits.Administrator)) {
        interaction.reply({
          content: `:no_entry_sign: Role must have admin privileges`,
          ephemeral: true,
        })
        return
      }

      if (!role?.editable) {
        interaction.reply({
          content: `:warning: The bot cannot manage that role. Please ensure the "sudo" role is above the admin role and has the "Manage Roles" permission.`,
          ephemeral: true,
        })
        return
      }

      await getDatabase().registerGuildAdminRole(role, guild)
      interaction.reply({
        content: `:white_check_mark: Admin role set to <@&${role.id}>`,
        ephemeral: true,
      })
    } catch (e) {
      interaction.reply({
        content: `:warning: Unable to set admin role ${
          e instanceof Error ? `- ${e.message}` : ''
        }`,
        ephemeral: true,
      })
    }
  }

  async handleSetAuto(
    interaction: CommandInteraction
  ): Promise<string | undefined> {
    const { guild } = interaction

    if (!guild) {
      interaction.reply({
        content: `:warning: The sudo-config command only works in guild channels`,
        ephemeral: true,
      })
      return
    }

    try {
      await getDatabase().clearGuildAdminRole(guild)
      interaction.reply({
        content: `:white_check_mark: Admin role assignment set to auto`,
        ephemeral: true,
      })
    } catch (e) {
      interaction.reply({
        content: `:warning: Unable to set admin role assignment to auto ${
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
      if (interaction.options.getSubcommand() === 'set-admin-role') {
        await this.handleSetRole(interaction)
      } else if (
        interaction.options.getSubcommand() === 'enable-admin-role-autoselect'
      ) {
        await this.handleSetAuto(interaction)
      } else {
        this.handleUnknownCommand(interaction)
      }
    } catch (e) {
      this.handleUnknownCommand(interaction)
    }

    return
  }
}

export { ConfigCommand }
