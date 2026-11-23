/** A slash command offered by the composer's suggestion list (GH20). */
export interface SlashCommand {
  /** Canonical name without the leading slash. */
  readonly name: string;
  readonly description: string;
}

export interface CommandCatalogResponse {
  readonly commands: readonly SlashCommand[];
}
