import type { TurnAttachment } from './attachment';

export type MessageRole = 'user' | 'assistant' | 'system';

/** Single transcript bubble. Mirrors core `HistoryMessage` (session.store.ts). */
export interface ChatMessage {
  readonly role: MessageRole;
  readonly content: string;
  /** Reversible `/undo` marker: row stays in the transcript but leaves LLM context. */
  readonly excludedFromContext: boolean;
  readonly createdAt: string;
  /** Files sent with this message (GH22); display metadata only. */
  readonly attachments?: readonly TurnAttachment[];
}

/** Draft assistant bubble while a turn streams. */
export interface PendingMessage {
  readonly content: string;
  readonly streaming: boolean;
}
