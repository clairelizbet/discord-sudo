import {
  APIApplicationCommandOption,
  ApplicationCommandType,
  LocalizationMap,
  Permissions,
} from 'discord-api-types/v9'
import { Interaction, BaseApplicationCommandData } from 'discord.js'

interface CommandData {
  type: ApplicationCommandType
  name: string
  name_localizations?: LocalizationMap | null
  name_localized?: string
  description: string
  description_localizations?: LocalizationMap | null
  description_localized?: string
  options?: APIApplicationCommandOption[]
  default_member_permissions: Permissions | null
  dm_permission?: boolean
}

interface BotCommand extends BaseApplicationCommandData {
  name: string
  type: ApplicationCommandType
  options?: APIApplicationCommandOption[]
  description: string
  defaultUserPermissions?: bigint
  acceptsDirectMessages?: boolean

  handleInteraction(interaction: Interaction): Promise<void>
  getData(): CommandData
  toJSON(): string
}

abstract class BaseBotCommand implements BotCommand {
  name: string
  type: ApplicationCommandType
  options?: APIApplicationCommandOption[]
  description: string
  defaultUserPermissions?: bigint
  acceptsDirectMessages?: boolean

  constructor(name: string) {
    this.name = name
    this.description = ''
    this.type = ApplicationCommandType.ChatInput
  }

  abstract handleInteraction(interaction: Interaction): Promise<void>

  getData(): CommandData {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      options: this.options,
      default_member_permissions: String(this.defaultUserPermissions),
      dm_permission: this.acceptsDirectMessages,
    }
  }

  toJSON(): string {
    return JSON.stringify(this.getData())
  }
}

export { BaseBotCommand, BotCommand }
