import { isAfter } from 'date-fns'
import { Guild, Snowflake, User } from 'discord.js'
import { BotCommand } from '../commands/base'
import { BaseDatabase } from './base'
import { AuthorizationRecord } from './models/AuthorizationRecord'

/**
 * userId and guildId concatenated
 */
type GuildUserId = string

class MemoryDatabase extends BaseDatabase {
  store: {
    authorizations: Map<GuildUserId, AuthorizationRecord>
    commandVersions: Map<string, string>
  }

  constructor() {
    super()
    this.store = {
      authorizations: new Map(),
      commandVersions: new Map(),
    }
  }

  makeGuildUserId(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): GuildUserId {
    return `${this.idForObject(user)}:${this.idForObject(guild)}`
  }

  async fetchAllAuthorizations(): Promise<AuthorizationRecord[]> {
    return [...this.store.authorizations.values()]
  }

  async fetchAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<AuthorizationRecord | undefined> {
    return this.store.authorizations.get(this.makeGuildUserId(user, guild))
  }

  async storeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake,
    duration: Minutes
  ): Promise<RecordId> {
    const recordId = this.makeGuildUserId(user, guild)
    const existingAuthorization = await this.fetchAuthorization(user, guild)
    const requestedAuthorization = new AuthorizationRecord(
      this.idForObject(user),
      this.idForObject(guild),
      duration
    )

    // Requesting a second authorization that expires before the current one is a no-op
    if (
      !existingAuthorization ||
      isAfter(
        requestedAuthorization.expiration,
        existingAuthorization.expiration
      )
    ) {
      this.store.authorizations.set(recordId, requestedAuthorization)
    }

    return recordId
  }

  async removeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<RecordId | undefined> {
    const recordId = this.makeGuildUserId(user, guild)
    return this.store.authorizations.delete(recordId) ? recordId : undefined
  }

  async removeAllGuildAuthorizations(
    guild: Guild | Snowflake
  ): Promise<RecordId[]> {
    const deletedIds: RecordId[] = []

    this.store.authorizations.forEach((authorization, recordId) => {
      this.store.authorizations.delete(recordId)
      deletedIds.push(recordId)
    })

    return deletedIds
  }

  async registerCommandVersion(
    command: BotCommand,
    version: string
  ): Promise<RecordId> {
    const recordId = JSON.stringify(command)
    this.store.commandVersions.set(recordId, version)
    return recordId
  }

  async clearCommandVersion(
    command: BotCommand
  ): Promise<RecordId | undefined> {
    const recordId = JSON.stringify(command)
    return this.store.commandVersions.delete(recordId) ? recordId : undefined
  }

  async fetchCommandVersion(command: BotCommand): Promise<string | undefined> {
    const recordId = JSON.stringify(command)
    return this.store.commandVersions.get(recordId)
  }
}

export { MemoryDatabase }
