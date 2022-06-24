let __timerManager: TimerManager

type TimerLocator = string

class TimerManager {
  timers: Map<TimerLocator, NodeJS.Timeout>

  constructor() {
    this.timers = new Map()
  }

  makeTimerLocator(guildId: string, userId: string): TimerLocator {
    return `${guildId}:${userId}`
  }

  setTimer(
    guildId: string,
    userId: string,
    onEnd: () => void,
    duration: Milliseconds,
    overrideExisting: boolean = true
  ): TimerLocator | undefined {
    const locator = this.makeTimerLocator(guildId, userId)
    const existingTimer = this.timers.get(locator)

    if (existingTimer && !overrideExisting) return undefined
    clearTimeout(existingTimer)

    this.timers.set(locator, setTimeout(onEnd, duration))
    return locator
  }

  getTimer(guildId: string, userId: string): NodeJS.Timeout | undefined {
    const locator = this.makeTimerLocator(guildId, userId)
    return this.timers.get(locator)
  }

  clearTimer(guildId: string, userId: string): void {
    const locator = this.makeTimerLocator(guildId, userId)
    this.timers.delete(locator)
  }
}

function getTimerManager(): TimerManager {
  if (__timerManager) return __timerManager
  __timerManager = new TimerManager()
  return __timerManager
}

// Convenience alias
function setTimer(
  guildId: string,
  userId: string,
  onEnd: () => void,
  duration: Milliseconds
): TimerLocator | undefined {
  return getTimerManager().setTimer(guildId, userId, onEnd, duration)
}

export { getTimerManager, setTimer }
