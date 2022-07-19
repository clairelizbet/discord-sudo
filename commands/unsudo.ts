import { ChatInputCommandInteraction } from 'discord.js'
import { PrivilegesCommand } from './privileges'

class UnsudoCommand extends PrivilegesCommand {
  constructor() {
    super()

    this.name = 'unsudo'
    this.description = `${this.description} (alias of /privileges drop)`
    this.options = []
  }

  async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await this.handleDrop(interaction)
    return
  }
}

export { UnsudoCommand }
