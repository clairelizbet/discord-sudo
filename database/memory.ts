import { Guild, Role, Snowflake, User } from 'discord.js'
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
    adminRoles: Map<string, string>
    commandVersions: Map<string, string>
  }

  constructor() {
    super()
    this.store = {
      authorizations: new Map(),
      adminRoles: new Map(),
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
    this.store.authorizations.set(
      recordId,
      new AuthorizationRecord(
        this.idForObject(user),
        this.idForObject(guild),
        duration
      )
    )

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

  async registerGuildAdminRole(
    role: Role | Snowflake,
    guild: Guild | Snowflake
  ): Promise<RecordId> {
    const guildId = this.idForObject(guild)
    this.store.adminRoles.set(guildId, this.idForObject(role))
    return guildId
  }

  async clearGuildAdminRole(
    guild: Guild | Snowflake
  ): Promise<RecordId | undefined> {
    const guildId = this.idForObject(guild)
    return this.store.adminRoles.delete(guildId) ? guildId : undefined
  }

  async fetchGuildAdminRole(
    guild: Guild | Snowflake
  ): Promise<string | undefined> {
    const guildId = this.idForObject(guild)
    return this.store.adminRoles.get(guildId)
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
