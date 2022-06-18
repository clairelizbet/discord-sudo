import { BotCommand } from './base'
import { SudoCommand } from './sudo'
import { UnsudoCommand } from './unsudo'
import { PrivilegesCommand } from './privileges'

const commands: BotCommand[] = [
  new SudoCommand(),
  new PrivilegesCommand(),
  new UnsudoCommand(),
]

export { commands }
