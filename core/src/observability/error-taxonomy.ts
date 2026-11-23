import { LlmError } from '../llm/llm.client';
import type { LlmErrorCode } from '../llm/llm.client';
import { LedgerError } from '../tools/tool-execution.repository';

/**
 * R1 — the turn-failure taxonomy.
 *
 * Every terminal turn failure lands in exactly one bucket, so "it failed
 * sometimes" becomes a count with a name. Buckets are deliberately coarse:
 * one per *fix*, not one per symptom.
 *
 *  - provider_http        the provider answered with a non-2xx
 *  - provider_timeout     timeout, unreachable, or aborted before an answer
 *  - malformed_completion a 2xx answer that was structurally not a completion
 *  - upstream_error       a 2xx answer carrying the provider's own error body
 *  - ledger               our tool ledger / invocation layer
 *  - tool_failure         a tool ran and returned { ok: false, failure.code }
 *  - tool_syntax_leak     a reply contained raw model tool-call markup (B2)
 *  - unknown              anything we have not classified (should trend to 0)
 */
export type ErrorBucket =
  | 'provider_http'
  | 'provider_timeout'
  | 'malformed_completion'
  | 'upstream_error'
  | 'ledger'
  | 'tool_failure'
  | 'tool_syntax_leak'
  | 'unknown';

export interface ErrorClassification {
  bucket: ErrorBucket;
  /** Stable machine code (LlmErrorCode, failure code, or a literal). */
  code: string;
  httpStatus?: number;
}

const LLM_BUCKETS: Readonly<Record<LlmErrorCode, ErrorBucket>> = {
  http: 'provider_http',
  upstream_error: 'upstream_error',
  malformed: 'malformed_completion',
  timeout: 'provider_timeout',
  unreachable: 'provider_timeout',
  aborted: 'provider_timeout',
};

export function classifyError(err: unknown): ErrorClassification {
  if (err instanceof LlmError) {
    return {
      bucket: LLM_BUCKETS[err.code] ?? 'provider_http',
      code: err.code,
      httpStatus: err.httpStatus,
    };
  }
  if (err instanceof LedgerError) {
    return { bucket: 'ledger', code: 'ledger_error' };
  }
  if (err instanceof Error) {
    // Mapped Nest exceptions still carry the original class in practice;
    // anything else is honestly unknown rather than quietly filed.
    return { bucket: 'unknown', code: err.name || 'error' };
  }
  return { bucket: 'unknown', code: 'non_error_throw' };
}

/**
 * B2 — raw tool-call markup leaking into a reply (DeepSeek-style DSML or the
 * `<|tool_calls|>` family). Recorded, never repaired: frequency first.
 */
// One shape, not a catalogue of spellings: a tag that opens with a pipe
// (`<|`, `<｜`) and mentions dsml/tool-calls/function-call before closing with
// a pipe. HTML tags never start with a pipe, so false positives stay rare.
const TOOL_SYNTAX = [
  /<[|｜]{1,2}[^<>\n]{0,60}(dsml|tool[▁_\s-]*calls?|function[▁_\s-]*call)[^<>\n]{0,60}[|｜]{1,2}>/i,
];

export function looksLikeToolSyntax(text: string | null | undefined): boolean {
  if (!text) return false;
  return TOOL_SYNTAX.some((pattern) => pattern.test(text));
}

/** A short, single-line sample for the ledger (never the whole reply). */
export function toolSyntaxSample(text: string): string {
  for (const pattern of TOOL_SYNTAX) {
    const match = pattern.exec(text);
    if (match) {
      const start = Math.max(0, match.index - 10);
      return text
        .slice(start, start + 120)
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return '';
}
