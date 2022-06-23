import { BotCommand } from './base'
import { SudoCommand } from './sudo'
import { UnsudoCommand } from './unsudo'
import { PrivilegesCommand } from './privileges'
import { ConfigCommand } from './config'

const commands: BotCommand[] = [
  new SudoCommand(),
  new PrivilegesCommand(),
  new UnsudoCommand(),
  new ConfigCommand(),
]

export { commands }
