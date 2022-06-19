import sqlite3, { Statement } from 'sqlite3'
import { Database, ISqlite, open } from 'sqlite'
import { formatISO, isAfter } from 'date-fns'
import { Guild, Snowflake, User } from 'discord.js'
import { BotCommand } from '../commands/base'
import { BaseDatabase } from './base'
import {
  AuthorizationRecord,
  AuthorizationRecordData,
} from './models/AuthorizationRecord'

enum DBTable {
  Authorizations = 'authorizations',
  CommandVersions = 'command_versions',
}

class SQLiteDatabase extends BaseDatabase {
  dbConn: Promise<Database>

  constructor() {
    super()

    this.dbConn = open({
      filename: process.env.DB_SQLITE_PATH ?? './sudo.db',
      driver: sqlite3.cached.Database,
    }).then((conn) => {
      return conn
        .exec(
          `CREATE TABLE IF NOT EXISTS ${DBTable.Authorizations} (userId TEXT, guildId TEXT, start TEXT, duration INTEGER)`
        )
        .then(() =>
          conn.exec(
            `CREATE TABLE IF NOT EXISTS ${DBTable.CommandVersions} (commandId TEXT, version TEXT)`
          )
        )
        .then(() => conn)
    })
  }

  async fetchAllAuthorizations(): Promise<AuthorizationRecord[]> {
    const db = await this.dbConn
    const authorizations: AuthorizationRecordData[] = await db.all(
      `SELECT userId, guildId, start, duration FROM ${DBTable.Authorizations}`
    )
    return authorizations.map(
      (dbAuthorization) => new AuthorizationRecord(dbAuthorization)
    )
  }

  async fetchAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<AuthorizationRecord | undefined> {
    const db = await this.dbConn
    const statement = await db.prepare(
      `SELECT userId, guildId, start, duration FROM ${DBTable.Authorizations} WHERE userId = @userId AND guildId = @guildId`
    )
    await statement.bind([this.idForObject(user), this.idForObject(guild)])
    const storedRecordData: AuthorizationRecordData | undefined =
      await statement.get()

    return storedRecordData
      ? new AuthorizationRecord(storedRecordData)
      : undefined
  }

  async storeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake,
    duration: Minutes
  ): Promise<RecordId> {
    const db = await this.dbConn
    let storeRes: ISqlite.RunResult<Statement> | undefined
    const authData: AuthorizationRecordData = {
      userId: this.idForObject(user),
      guildId: this.idForObject(guild),
      start: formatISO(Date.now()),
      duration,
    }

    const fetchStatement = await db.prepare(
      `SELECT rowid, userId, guildId, start, duration FROM ${DBTable.Authorizations} WHERE userId = @userId AND guildId = @guildId`
    )
    await fetchStatement.bind([this.idForObject(user), this.idForObject(guild)])
    const existingAuthData:
      | (AuthorizationRecordData & { rowid: number })
      | undefined = await fetchStatement.get()

    if (!existingAuthData) {
      // First authorization for this guild/user combo
      const insertStatement = await db.prepare(
        `INSERT INTO ${DBTable.Authorizations} (userId, guildId, start, duration) VALUES (@userId, @guildId, @start, @duration)`
      )
      await insertStatement.bind([
        authData.userId,
        authData.guildId,
        authData.start,
        authData.duration,
      ])
      storeRes = await insertStatement.run()
    } else if (
      isAfter(
        new AuthorizationRecord(authData).expiration,
        new AuthorizationRecord(existingAuthData).expiration
      )
    ) {
      const updateStatement = await db.prepare(
        `UPDATE ${DBTable.Authorizations} SET start = @start, duration = @duration WHERE userId = @userId AND guildId = @guildId`
      )
      await updateStatement.bind([
        authData.start,
        authData.duration,
        authData.userId,
        authData.guildId,
      ])
      storeRes = await updateStatement.run()
    } else {
      // Requesting a second authorization that expires before the current one is a no-op
    }

    const recordId = storeRes?.lastID ?? existingAuthData?.rowid
    return String(recordId)
  }

  async removeAuthorization(
    user: User | Snowflake,
    guild: Guild | Snowflake
  ): Promise<RecordId | undefined> {
    const db = await this.dbConn
    const deleteStatement = await db.prepare(
      `DELETE FROM ${DBTable.Authorizations} WHERE userId = @userId AND guildId = @guildId`
    )
    await deleteStatement.bind([
      this.idForObject(user),
      this.idForObject(guild),
    ])
    const res = await deleteStatement.run()

    return res.lastID ? String(res.lastID) : undefined
  }

  async removeAllGuildAuthorizations(
    guild: Guild | Snowflake
  ): Promise<RecordId[]> {
    const db = await this.dbConn

    // This two-step fetch and delete is suboptimal and has
    // some edge cases where an incorrect array of IDs could be returned.
    // We don't do aything with it right now, so it's *basically* fine??
    // Would be neat to do this better but I'm unsure how to get removed rowids from stmt.run()
    const fetchStatement = await db.prepare(
      `SELECT rowid FROM ${DBTable.Authorizations} WHERE guildId = @guildId`
    )
    await fetchStatement.bind([this.idForObject(guild)])
    const fetchRes = await fetchStatement.all()
    const deletedIds = fetchRes.map((row: { rowid: string }) => row.rowid)

    const deleteStatement = await db.prepare(
      `DELETE FROM ${DBTable.Authorizations} WHERE guildId = @guildId`
    )

    await deleteStatement.bind([this.idForObject(guild)])
    await deleteStatement.run()

    return deletedIds
  }

  async registerCommandVersion(
    command: BotCommand,
    version: string
  ): Promise<RecordId> {
    const db = await this.dbConn
    let storeRes: ISqlite.RunResult<Statement> | undefined
    const versionData = {
      commandId: JSON.stringify(command),
      version,
    }
    const fetchStatement = await db.prepare(
      `SELECT rowid FROM ${DBTable.CommandVersions} WHERE commandId = @commandId`
    )
    await fetchStatement.bind([versionData.commandId])
    const existingVersion: { rowid: number } | undefined =
      await fetchStatement.get()

    if (!existingVersion) {
      // Command does not have a stored version
      const insertStatement = await db.prepare(
        `INSERT INTO ${DBTable.CommandVersions} (commandId, version) VALUES (@commandId, @version)`
      )
      await insertStatement.bind([versionData.commandId, versionData.version])
      storeRes = await insertStatement.run()
    } else {
      // A version is already stored, let's replace it
      const updateStatement = await db.prepare(
        `UPDATE ${DBTable.CommandVersions}  SET version = @version WHERE commandId = @commandId`
      )
      await updateStatement.bind([versionData.version, versionData.commandId])
      storeRes = await updateStatement.run()
    }

    const recordId = storeRes?.lastID ?? existingVersion?.rowid
    return String(recordId)
  }

  async clearCommandVersion(
    command: BotCommand
  ): Promise<RecordId | undefined> {
    const db = await this.dbConn
    const commandId = JSON.stringify(command)
    const deleteStatement = await db.prepare(
      `DELETE FROM ${DBTable.CommandVersions}  WHERE commandId = @commandId`
    )
    await deleteStatement.bind([commandId])
    const storeRes = await deleteStatement.run()

    return storeRes.lastID ? String(storeRes.lastID) : undefined
  }

  async fetchCommandVersion(command: BotCommand): Promise<string | undefined> {
    const db = await this.dbConn
    const fetchStatement = await db.prepare(
      `SELECT version FROM ${DBTable.CommandVersions}  WHERE commandId = @commandId`
    )
    await fetchStatement.bind([JSON.stringify(command)])
    const versionRecord: { version: string } | undefined =
      await fetchStatement.get()

    return versionRecord?.version
  }
}

export { SQLiteDatabase }