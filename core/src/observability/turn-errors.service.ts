import { Injectable, Logger } from '@nestjs/common';
import { SessionDatabaseService } from '../session/session-database.service';
import {
  classifyError,
  looksLikeToolSyntax,
  toolSyntaxSample,
} from './error-taxonomy';
import type { ErrorBucket } from './error-taxonomy';

export interface TurnErrorSummary {
  /** ISO timestamp the window starts at. */
  since: string;
  total: number;
  byBucket: Partial<Record<ErrorBucket, number>>;
  /** B2 sightings inside the window. */
  toolSyntaxLeaks: number;
  last: { bucket: ErrorBucket; code: string; at: string } | null;
}

export interface TurnErrorContext {
  requestId?: string;
  sessionId?: string;
}

const MAX_DETAIL_CHARS = 300;
const RETENTION_DAYS = 30;

/**
 * R1 — the turn-error ledger.
 *
 * Failures are counted in SQLite, not in memory, so the counts survive a
 * restart and a soak can be reviewed after the fact. One row per failure
 * (or leakage sighting), classified by `error-taxonomy.ts`. `unknown` must
 * trend to zero: anything landing there is a classification bug.
 */
@Injectable()
export class TurnErrorsService {
  private readonly logger = new Logger(TurnErrorsService.name);

  constructor(private readonly database: SessionDatabaseService) {}

  recordError(err: unknown, context: TurnErrorContext = {}): void {
    const classification = classifyError(err);
    this.record({
      ...classification,
      ...context,
      detail: err instanceof Error ? err.message : undefined,
    });
  }

  /** A tool ran and returned `{ ok: false, failure: { code } }`. */
  recordToolFailure(code: string, context: TurnErrorContext = {}): void {
    this.record({ bucket: 'tool_failure', code, ...context });
  }

  /**
   * B2 — count raw tool-call markup in a model reply. Recorded once per reply,
   * never repaired.
   */
  checkReplyLeak(
    reply: string | null | undefined,
    context: TurnErrorContext = {},
  ): void {
    if (!looksLikeToolSyntax(reply)) return;
    this.record({
      bucket: 'tool_syntax_leak',
      code: 'tool_syntax',
      detail: toolSyntaxSample(reply ?? ''),
      ...context,
    });
  }

  record(input: {
    bucket: ErrorBucket;
    code: string;
    httpStatus?: number;
    requestId?: string;
    sessionId?: string;
    detail?: string;
  }): void {
    const detail = input.detail
      ? input.detail.replace(/\s+/g, ' ').trim().slice(0, MAX_DETAIL_CHARS)
      : null;
    try {
      this.database.connection
        .prepare(
          `INSERT INTO turn_errors
            (at, bucket, code, http_status, request_id, session_id, detail)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          new Date().toISOString(),
          input.bucket,
          input.code,
          input.httpStatus ?? null,
          input.requestId ?? null,
          input.sessionId ?? null,
          detail,
        );
    } catch (err) {
      // Counting must never break a turn.
      this.logger.warn(
        `Failed to record ${input.bucket}/${input.code}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
    }
    // Structured line for the log review (R2).
    this.logger.warn(
      `[TurnError] bucket=${input.bucket} code=${input.code}` +
        (input.httpStatus ? ` http=${input.httpStatus}` : '') +
        (input.requestId ? ` request=${input.requestId}` : '') +
        (detail ? ` detail="${detail}"` : ''),
    );
  }

  /** Counts inside the window (default: the last 24 hours). */
  counts(windowMs = 24 * 60 * 60 * 1000): TurnErrorSummary {
    const since = new Date(Date.now() - windowMs).toISOString();
    const byBucket: Partial<Record<ErrorBucket, number>> = {};
    let total = 0;
    try {
      const rows = this.database.connection
        .prepare(
          'SELECT bucket, COUNT(*) AS c FROM turn_errors WHERE at >= ? GROUP BY bucket',
        )
        .all(since) as { bucket: ErrorBucket; c: number }[];
      for (const row of rows) {
        byBucket[row.bucket] = row.c;
        total += row.c;
      }
      const last = this.database.connection
        .prepare(
          'SELECT bucket, code, at FROM turn_errors ORDER BY id DESC LIMIT 1',
        )
        .get() as { bucket: ErrorBucket; code: string; at: string } | undefined;
      return {
        since,
        total,
        byBucket,
        toolSyntaxLeaks: byBucket.tool_syntax_leak ?? 0,
        last: last ?? null,
      };
    } catch {
      return { since, total: 0, byBucket: {}, toolSyntaxLeaks: 0, last: null };
    }
  }

  /** Drop rows older than the retention window (cheap, best-effort). */
  prune(now = new Date()): void {
    const cutoff = new Date(
      now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    try {
      this.database.connection
        .prepare('DELETE FROM turn_errors WHERE at < ?')
        .run(cutoff);
    } catch {
      // Retention is best-effort.
    }
  }
}
