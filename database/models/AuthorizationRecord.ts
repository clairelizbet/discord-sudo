import {
  addMinutes,
  differenceInMilliseconds,
  formatISO,
  isPast,
  parseISO,
} from 'date-fns'
import { Snowflake } from 'discord.js'

interface AuthorizationRecordData {
  userId: Snowflake
  guildId: Snowflake
  start: ISO8601DateTime
  duration: Minutes
}

class AuthorizationRecord implements AuthorizationRecordData {
  userId: Snowflake
  guildId: Snowflake
  start: ISO8601DateTime
  duration: Minutes
  expiration: Date

  constructor(data: AuthorizationRecordData)
  constructor(
    userId: Snowflake,
    guildId: Snowflake,
    duration: Minutes,
    start?: ISO8601DateTime
  )

  constructor(
    userIdOrData: AuthorizationRecordData | Snowflake,
    guildId?: Snowflake,
    duration?: Minutes,
    start?: ISO8601DateTime
  ) {
    if (typeof userIdOrData === 'string') {
      this.userId = userIdOrData
      this.guildId = guildId!
      this.start = start || formatISO(Date.now())
      this.duration = duration!
    } else {
      this.userId = userIdOrData.userId
      this.guildId = userIdOrData.guildId
      this.start = userIdOrData.start
      this.duration = userIdOrData.duration
    }

    this.expiration = addMinutes(parseISO(this.start), this.duration)
  }

  isExpired(): boolean {
    return isPast(this.expiration)
  }

  millisecondsUntilExpiration(): number {
    return differenceInMilliseconds(this.expiration, Date.now())
  }
}

export { AuthorizationRecord, AuthorizationRecordData }
