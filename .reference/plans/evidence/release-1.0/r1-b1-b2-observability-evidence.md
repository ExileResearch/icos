# R1 + B1 + B2 — error taxonomy, bounded retry, leakage counts

> Status: **implemented, live run pending** (2026-10-26)

## R1 — turn-error taxonomy with counts

- `src/observability/error-taxonomy.ts` — one bucket per *fix*, not per symptom:
  `provider_http`, `provider_timeout`, `malformed_completion`, `upstream_error`,
  `ledger`, `tool_failure`, `tool_syntax_leak`, `unknown`.
- `LlmError` now carries a stable `code` (`http`, `upstream_error`, `malformed`,
  `timeout`, `unreachable`, `aborted`) set at every construction site, so the
  classification never parses message text.
- `src/observability/turn-errors.service.ts` — append-only `turn_errors` table in
  the sessions DB (new table in the schema SQL, so existing files get it on
  open). Rows carry bucket, code, http status, request/session id and a bounded
  300-char single-line detail. Counts survive restarts; rows older than 30 days
  are pruned best-effort.
- Every terminal turn failure records **exactly once**:
  - the eight mapped failure throws now go through `failTurn(err, mapper)`
    (recording happens there, not in the mappers, so `providerError`'s fallback
    into `ledgerError` cannot double-count);
  - the two streaming catch blocks record only when the client did not cancel;
  - tool results with `{ ok: false, failure: { code } }` record a
    `tool_failure` row when the step is rendered.
- Structured log line on every record: `[TurnError] bucket=… code=… http=…
  request=… detail="…"` (R2 log review).
- `GET /core/health` gains an `errors` block: `since` (24 h), `total`,
  `byBucket`, `toolSyntaxLeaks`, and `last`.

## B1 — one bounded retry

`LlmClient.complete()` now makes at most **two** attempts, 250 ms apart, and only
when **all** of these hold: no token was emitted, the client did not abort, and
the error is a 502-class (`http`, `upstream_error`, `malformed`). Timeouts (504)
are not retried — they already consumed their budget. A stream that has emitted
a token is never replayed, so text cannot be duplicated.

## B2 — tool-syntax leakage counted, not repaired

`looksLikeToolSyntax()` matches a single conservative shape (an angle tag opening
with a pipe that mentions `dsml` / `tool calls` / `function call`); HTML never
opens with a pipe. Each flagged reply records one `tool_syntax_leak` row with a
120-char sample. No repair layer.

## Verification

- Unit: **1327 passed** (1 deliberate skip) — includes new specs for the
  taxonomy (bucket mapping, leak detection, sample bounding), the ledger
  (counts, window, reopen, pruning, bounded detail), the retry (4 cases) and the
  health block.
- E2E: **90 passed** — a forced provider 502 records exactly one
  `provider_http` (the retry does not double-count); a reply containing
  `<|dsml|>` records one `tool_syntax_leak`; a cancelled stream records nothing.
  The first two also assert the `/core/health` surface.
- `tsc` and `eslint` clean at the last run.

## Honest remainder

- **The live run was not completed.** The machine overheated during the core
  rebuild and the run was cancelled. What remains to observe live: one normal
  turn (health `errors.total = 0`), then a turn against a dead provider endpoint
  (`provider_timeout` ≥ 1, exactly two provider attempts in the log), then the
  counts in `/core/health`. Until that is done R1 stays unticked — it also needs
  a week of counts (R2) to be meaningful.
- `tool_failure` counts are recorded at the conversation layer; a tool failure
  that never reaches a rendered step is not counted.
- The taxonomy's `unknown` bucket is expected to trend to zero; any row there is
  a classification bug.
- No config was added, so `.env.sample` is unchanged.
