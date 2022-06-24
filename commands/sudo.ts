import { CommandInteraction } from 'discord.js'
import {
  getGuildAdminRole,
  grantGuildUserRoles,
  removeGuildUserRoles,
} from '../discord'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} from 'discord-api-types/v9'
import { intFromValue } from '../util/number'
import { BaseBotCommand } from './base'
import { getDatabase } from '../database'
import { setTimer } from '../timers'

class SudoCommand extends BaseBotCommand {
  defaultUserPermissions: bigint
  acceptsDirectMessages: boolean

  constructor() {
    super('sudo')

    this.description = 'Grants you temporary admin access'
    this.defaultUserPermissions = PermissionFlagsBits.Administrator
    this.acceptsDirectMessages = false

    this.options = [
      {
        name: 'duration',
        description: `How long to grant admin access in minutes (default: ${this.defaultDuration}, max: ${this.maxDuration})`,
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ]
  }

  get defaultDuration(): number {
    return intFromValue(process.env.DEFAULT_DURATION) ?? 5
  }

  get maxDuration(): number {
    return intFromValue(process.env.MAX_DURATION) ?? 120
  }

  async handleInteraction(interaction: CommandInteraction): Promise<void> {
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

    const duration =
      intFromValue(interaction.options.get('duration')?.value) ??
      this.defaultDuration

    if (duration < 1) {
      interaction.reply({
        content: `:no_entry_sign: Access duration in minutes must be a positive integer if provided`,
        ephemeral: true,
      })
      return
    }

    if (duration > this.maxDuration) {
      interaction.reply({
        content: `:no_entry_sign: Access duration cannot exceed ${this.maxDuration} minutes`,
        ephemeral: true,
      })
      return
    }

    try {
      const adminRole = await getGuildAdminRole(guild)
      await getDatabase().storeAuthorization(user.id, guild, duration)
      await grantGuildUserRoles(guild, user.id, adminRole)

      interaction.reply({
        content: `:white_check_mark: Admin access granted for ${duration} minute${
          duration > 1 ? 's' : ''
        }`,
        ephemeral: true,
      })

      setTimer(
        guild.id,
        user.id,
        () => {
          try {
            guild.members
              .fetch(user.id)
              .then((userInfo) =>
                userInfo.roles.cache.filter((userRole) =>
                  userRole.permissions.has('ADMINISTRATOR')
                )
              )
              .then((userAdminRoles) =>
                removeGuildUserRoles(
                  guild,
                  user.id,
                  userAdminRoles,
                  'Session expired'
                ).then(() => getDatabase().removeAuthorization(user.id, guild))
              )
          } catch (e) {
            console.error(e)
          }
        },
        1000 * 60 * duration
      )
    } catch (e) {
      interaction.reply({
        content: `:warning: Unable to grant admin access ${
          e instanceof Error ? `- ${e.message}` : ''
        }`,
        ephemeral: true,
      })
    }
  }
}

export { SudoCommand }
