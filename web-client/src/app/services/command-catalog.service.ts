import { Injectable, inject } from '@angular/core';
import { COMMANDS_ENDPOINT } from '../../constants';
import type { CommandCatalogResponse, SlashCommand } from '../models/slash-command';
import { CoreApiService } from './core-api.service';

/**
 * Slash-command catalog for the composer (GH20). Fetched once and cached;
 * suggestions are best-effort, so a failure degrades to "no suggestions"
 * rather than blocking the chat.
 */
@Injectable({ providedIn: 'root' })
export class CommandCatalogService {
  private readonly api = inject(CoreApiService);
  private cache: readonly SlashCommand[] | null = null;
  private pending: Promise<readonly SlashCommand[]> | null = null;

  async list(): Promise<readonly SlashCommand[]> {
    if (this.cache) return this.cache;
    this.pending ??= this.api
      .get<CommandCatalogResponse>(COMMANDS_ENDPOINT)
      .then((response) => {
        this.cache = response.commands;
        this.pending = null;
        return this.cache;
      })
      .catch(() => {
        this.pending = null;
        return [] as readonly SlashCommand[];
      });
    return this.pending;
  }
}
