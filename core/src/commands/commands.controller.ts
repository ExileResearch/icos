import { Controller, Get } from '@nestjs/common';
import { CommandDispatcher } from './command-dispatcher';

/**
 * Slash-command catalog for the client (GH20). Read-only and side-effect free:
 * the web composer uses it to offer suggestions while the operator types.
 */
@Controller('core/commands')
export class CommandsController {
  constructor(private readonly commands: CommandDispatcher) {}

  @Get()
  list(): { commands: { name: string; description: string }[] } {
    return { commands: this.commands.commandDescriptors };
  }
}
