import { Snowflake, User, Guild } from 'discord.js'
import { AuthorizationRecord } from './models/AuthorizationRecord'
import { BotCommand } from '../commands/base'

type ObjectWithId = {
  id: string
}

interface Database {
  fetchAllAuthorizations(): Promise<AuthorizationRecord[]>

  fetchAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<AuthorizationRecord | undefined>

  storeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake,
    duration: Minutes
  ): Promise<RecordId>

  removeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<RecordId | undefined>

  removeAllGuildAuthorizations(guild: Guild | Snowflake): Promise<RecordId[]>

  registerCommandVersion(
    command: BotCommand,
    version: string
  ): Promise<RecordId>

  clearCommandVersion(command: BotCommand): Promise<RecordId | undefined>

  fetchCommandVersion(command: BotCommand): Promise<string | undefined>
}

abstract class BaseDatabase implements Database {
  idForObject(obj: ObjectWithId | string): string {
    return typeof obj === 'string' ? obj : obj.id
  }

  abstract fetchAllAuthorizations(): Promise<AuthorizationRecord[]>

  abstract fetchAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<AuthorizationRecord | undefined>

  abstract storeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake,
    duration: Minutes
  ): Promise<RecordId>

  abstract removeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<RecordId | undefined>

  abstract removeAllGuildAuthorizations(
    guild: Guild | Snowflake
  ): Promise<RecordId[]>

  abstract registerCommandVersion(
    command: BotCommand,
    version: string
  ): Promise<RecordId>

  abstract clearCommandVersion(
    command: BotCommand
  ): Promise<RecordId | undefined>

  abstract fetchCommandVersion(command: BotCommand): Promise<string | undefined>
}

export { Database, BaseDatabase }
