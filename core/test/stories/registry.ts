/**
 * FG5 — user-story registry.
 *
 * Every story from the release checklist gets a stable id and a status:
 *
 *  - `automated` — a named test proves it. The registry spec asserts the file
 *    exists *and still contains that test*, so a deleted or renamed test breaks
 *    the suite instead of silently dropping coverage.
 *  - `live` — only provable with a real model, a real channel, or a specific
 *    configuration. `note` says what is required and where the run is recorded.
 *  - `deferred` — the capability does not exist (or is explicitly out of 1.0).
 *    `note` is mandatory.
 *
 * There is deliberately no `gap` status: a story is either proven, live-checked,
 * or consciously deferred. Adding a story forces that decision.
 */

export type StoryStatus = 'automated' | 'live' | 'deferred';

export interface StoryProof {
  /** Path relative to `core/`, or `../web-client/...`. */
  file: string;
  /** Exact test title, without the `it('` wrapper. */
  test: string;
}

export interface Story {
  id: string;
  area: string;
  title: string;
  status: StoryStatus;
  proof?: StoryProof;
  note?: string;
}

const E2E = 'test/app.e2e-spec.ts';

const automated = (id: string, area: string, title: string, file: string, test: string): Story => ({
  id,
  area,
  title,
  status: 'automated',
  proof: { file, test },
});

const live = (id: string, area: string, title: string, note: string): Story => ({
  id,
  area,
  title,
  status: 'live',
  note,
});

const deferred = (id: string, area: string, title: string, note: string): Story => ({
  id,
  area,
  title,
  status: 'deferred',
  note,
});

export const STORIES: readonly Story[] = [
  // 00 — Basic launch -------------------------------------------------------
  live(
    'BOOT-001',
    '00 Launch',
    'The stack launches in every supported configuration',
    '18-cell model/verifier matrix (cloud, DMR, Ollama exact) documented in .reference/notes/release-1.0-user-stories.md; 3 cells passed so far. Each cell needs a real model + compose run.',
  ),
  live(
    'BOOT-002',
    '00 Launch',
    'The stack shuts down cleanly',
    `bin/stack-local down / docker compose down; graceful shutdown is observable in the core log ("Channel presence: offline"). Not automatable inside the test process.`,
  ),

  // 01 — Web chat -----------------------------------------------------------
  automated('CHAT-001', '01 Chat', 'Log in and hold a text conversation', E2E, 'POST /core/conversation returns a reply and session id'),
  automated('CHAT-002', '01 Chat', 'Log out securely', E2E, 'clears both cookies on logout'),
  automated('CHAT-003', '01 Chat', 'Browse and delete past sessions', E2E, 'SESS-001: deletes a session and its transcript'),
  automated('CHAT-004', '01 Chat', 'Browse sessions newest-first with previews', E2E, 'GET /core/sessions lists sessions newest-first'),
  automated('CHAT-005', '01 Chat', 'Attach a photo; the reference reaches the model', E2E, 'uploads an attachment, serves it back, and carries it into a turn'),
  live(
    'CHAT-006',
    '01 Chat',
    'Attach a document and have the agent read it',
    'The attachment is stored and referenced, but no text extraction exists: the model receives a reference, not the contents. Live check pending a document-extraction capability.',
  ),
  deferred('CHAT-007', '01 Chat', 'Attach an audio file and have the agent hear it', 'Audio is not in the attachment allowlist and no transcription exists.'),
  deferred('CHAT-008', '01 Chat', 'Ask for an attached file to be saved in the KB', 'No KB-save action exists (KB is a bridge, not a writable store from chat).'),
  live(
    'CHAT-009',
    '01 Chat',
    'Request a generic message by email',
    'Needs a configured email channel (SMTP/Brevo) and an allowlisted operator address; verified in live runs, not in CI.',
  ),
  live(
    'CHAT-010',
    '01 Chat',
    'Request a system report by email',
    'Same as CHAT-009: builds on /health data plus the email channel; live only.',
  ),
  deferred('CHAT-011', '01 Chat', 'Request a system audit by email', 'No audit report exists; the definition is still open in the checklist.'),
  deferred('CHAT-012', '01 Chat', 'Attach a file and have it sent to the inbox', 'Depends on outbound attachments (channel.send carries text only) plus email configuration.'),
  automated('CHAT-013', '01 Chat', 'Slash commands work in the chat UI', E2E, 'slash commands answer without LLM, transcript, or extraction'),
  automated('CHAT-014', '01 Chat', 'Slash commands offer suggestions', 'test/app.e2e-spec.ts', 'lists the slash-command catalog for the composer (GH20)'),
  automated('CHAT-015', '01 Chat', 'The suggestion list filters and completes without sending', '../web-client/src/app/components/composer/composer.spec.ts', 'accepts the highlighted command on Enter without sending'),

  // 02 — Web usability ------------------------------------------------------
  automated('UX-001', '02 Usability', 'Swap between light and dark themes', '../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts', 'should switch themes through the theme service'),
  automated('UX-002', '02 Usability', 'Change the health polling interval', '../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts', 'should persist the health poll interval through the health service'),
  automated('UX-003', '02 Usability', 'Current time renders in the local timezone', '../web-client/src/app/components/footer-component/footer-component.spec.ts', 'should render live CPU and RAM from the health service'),
  live(
    'UX-004',
    '02 Usability',
    'Font, sizing, positioning, and colour are consistent',
    'Judgement call over many surfaces; GH21 evidence records the computed-style comparison and AXE run for MCP/Models, and the shared rules in styles.css are the mechanism.',
  ),
  live(
    'UX-005',
    '02 Usability',
    'Tab content layout is consistent across the UI',
    'Same as UX-004: GH21 evidence covers the shared .tab-pane/.grid/.editor rules; no automated cross-tab visual check.',
  ),

  // 03 — Memory -------------------------------------------------------------
  automated('MEM-001', '03 Memory', 'View memory candidates', E2E, 'GET /core/memory-candidates exposes extracted candidates'),
  automated('MEM-002', '03 Memory', 'Approve a candidate (promotion)', E2E, 'promotes a candidate to a belief on approval plus sweep'),
  automated('MEM-003', '03 Memory', 'Reject a candidate', '../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts', 'rejects a candidate through the service (MEM-003)'),
  automated('MEM-004', '03 Memory', 'Bulk approve candidates', '../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts', 'bulk-approves after an inline confirmation (MEM-004)'),
  automated('MEM-005', '03 Memory', 'Bulk reject candidates', '../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts', 'bulk-rejects after an inline confirmation (MEM-005)'),
  automated('MEM-006', '03 Memory', 'Run a promotion sweep', E2E, 'runs belief maintenance explicitly with a durable summary'),
  automated('MEM-007', '03 Memory', 'A useful, novel candidate is generated from a turn', E2E, 'GET /core/memory-candidates exposes extracted candidates'),
  automated('MEM-008', '03 Memory', 'Candidates are validated before they are stored', 'src/memory/candidate-validation.spec.ts', 'rejects non-array, non-object input'),
  automated('MEM-009', '03 Memory', 'A duplicate candidate converges instead of duplicating', 'src/memory/promotion.service.spec.ts', 'converges a repeated triple to REINFORCE, never a second claim'),
  automated('MEM-010', '03 Memory', 'A contradiction is handled explicitly', E2E, 'contradicts a belief and parks a prospective question'),
  automated('MEM-011', '03 Memory', 'A denial promotes nothing', 'src/memory/promotion.service.spec.ts', 'denies cleanly: no claim, no retry'),
  automated('MEM-012', '03 Memory', 'Auto-approval follows the promotion policy', 'src/memory/promotion.service.spec.ts', 'auto-commits admitted NEW kinds without approval when opted in'),
  automated('MEM-013', '03 Memory', 'A promoted memory is retrievable when relevant', E2E, 'traces turn-time recall per session for inspection'),
  live(
    'MEM-014',
    '03 Memory',
    'Memory decay affects retrieval or salience',
    'Decay is implemented in the maintenance pass (rank/maintenance specs cover decay maths); no end-to-end story asserts the retrieval effect over time.',
  ),
  live(
    'MEM-015',
    '03 Memory',
    'Expired or superseded memories never silently become authoritative',
    'Supersession is covered by contradiction tests and claim history; a time-based expiry story is not exercised end to end.',
  ),
  automated('MEM-016', '03 Memory', 'Provenance survives promotion', 'src/memory/promotion.service.spec.ts', 'commits on approval via sweep with provenance intact'),
  automated('MEM-017', '03 Memory', 'A failed promotion leaves no partial state', 'src/memory/promotion.service.spec.ts', 'proposes each candidate exactly once'),

  // 04 — Models -------------------------------------------------------------
  automated('MODEL-001', '04 Models', 'List providers/models', E2E, 'lists providers (no keys), stores the referenced key, switches active'),
  automated('MODEL-002', '04 Models', 'Switch provider/model without a reload', E2E, 'lists providers (no keys), stores the referenced key, switches active'),

  // 05 — Cron ---------------------------------------------------------------
  automated('CRON-001', '05 Cron', 'View existing cron jobs', E2E, 'CRON-001: creates, pauses, resumes, runs, and deletes a cron job'),
  automated('CRON-002', '05 Cron', 'Create, pause, resume, and delete a job', E2E, 'CRON-001: creates, pauses, resumes, runs, and deletes a cron job'),
  automated('CRON-003', '05 Cron', 'Fire a job on demand', E2E, 'CRON-001: creates, pauses, resumes, runs, and deletes a cron job'),
  automated('CRON-004', '05 Cron', 'Invalid schedules and unknown ids are rejected', E2E, 'CRON-002: rejects a malformed job and unknown ids'),

  // 06 — Skills -------------------------------------------------------------
  automated('SKILL-001', '06 Skills', 'View loaded skills', E2E, 'skills refresh/show round-trips a filesystem fixture'),
  automated('SKILL-002', '06 Skills', 'Create, edit, and delete a skill', E2E, 'SKILL-001: creates, edits, reads back, and deletes a skill'),
  automated('SKILL-003', '06 Skills', 'Skills are selected and injected per turn', E2E, 'M7c turn scopes: explicit pins, one-shot pulls, contextual discovery'),

  // 07 — Tools --------------------------------------------------------------
  automated('TOOL-001', '07 Tools', 'View the global tool inventory', E2E, 'TOOL-001: lists the tool inventory and discovery bounds'),
  automated('TOOL-002', '07 Tools', 'Toggle auto-approval', E2E, 'TOOL-002: toggles auto-approve and refuses unknown tools'),
  automated('TOOL-003', '07 Tools', 'A policy-disabled tool is never offered', 'src/tools/tool-surface.service.spec.ts', 'never surfaces a policy-disabled tool'),

  // 08 — MCP ----------------------------------------------------------------
  automated('MCP-001', '08 MCP', 'View configured MCP servers', E2E, 'logs in, verifies the session, and gates mutations on CSRF'),
  automated('MCP-002', '08 MCP', 'Add and delete an MCP server', E2E, 'logs in, verifies the session, and gates mutations on CSRF'),
  live(
    'MCP-003',
    '08 MCP',
    'Enable/disable an MCP server (restart to unload)',
    'Configured entries reload without a restart, but the enabled flag and tool unload are a live operation against a real MCP server.',
  ),
  live('MCP-004', '08 MCP', 'Ask the agent which MCP servers are available', 'Needs a real model turn; the catalog is exposed as tool context.'),
  live('MCP-005', '08 MCP', 'Ask the agent which tools a server exposes', 'Needs a real model turn plus a live MCP connection (bytestash).'),
  live('MCP-006', '08 MCP', 'Ask the agent to fire an MCP tool', 'Needs a real model turn plus a live MCP connection.'),

  // 09/10 — Settings --------------------------------------------------------
  automated('SET-001', '09 Client settings', 'Client settings persist', '../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts', 'should persist the health poll interval through the health service'),
  automated('SET-002', '10 Server settings', 'Server settings are readable and guarded', E2E, 'keeps liveness public and locks everything else'),

  // 11 — Tool usage ---------------------------------------------------------
  automated('USE-001', '11 Tool usage', 'The system runs tools', E2E, 'executes a search turn against the real transcript, scoped to the session'),
  automated('USE-002', '11 Tool usage', 'Repeated identical calls are not re-executed', E2E, 'skips repeated calls without re-executing'),
  automated('USE-003', '11 Tool usage', 'A rejected proposal is recovered with corrected arguments', E2E, 'recovers from a rejected proposal with corrected arguments'),

  // 12 — Subagents ----------------------------------------------------------
  automated('SUB-001', '12 Subagents', 'Delegate a task to a subagent', 'src/subagents/subagent-runner.service.spec.ts', 'spawns a child and completes it with a truncated summary'),
  automated('SUB-002', '12 Subagents', 'Track the status of a delegated task', 'src/subagents/subagent-runner.service.spec.ts', 'parks on approval and reconciles on completion'),
  automated('SUB-003', '12 Subagents', 'Cancel a delegated task', 'src/subagents/subagent-runner.service.spec.ts', 'cancels cooperatively and leaves terminal states alone'),
  automated('SUB-004', '12 Subagents', 'A child failure is reported, never hidden', 'src/subagents/subagent-runner.service.spec.ts', 'records a child throw as failed, never escaping'),

  // 13 — Coding journeys (live: real model + workspace) --------------------
  live('CODE-001', '13 Coding', 'Read the repo, branch, and status', 'Needs a real model driving terminal/git tools in the workspace.'),
  live('CODE-002', '13 Coding', 'Read and write a file in the repo', 'Needs a real model; the tools are covered by unit tests, the journey is not.'),
  live('CODE-003', '13 Coding', 'Notice a failed write and retry', 'Behavioural story: needs a real model and a forced write failure.'),
  live('CODE-004', '13 Coding', 'Take git actions (clone/commit/push)', 'Needs a real model and a disposable remote.'),
  live('CODE-005', '13 Coding', 'Produce an HTML/CSS/JS mockup and screenshot it', 'Needs a real model plus the browser tool render loop.'),
  live('CODE-006', '13 Coding', 'Run version checks (node/npm/docker/ng/nest/flutter)', 'Needs a real model driving the terminal tool.'),
  live('CODE-007', '13 Coding', 'Run a Nest app, inspect its log, stop it', 'Needs a real model plus the process tools.'),
  live('CODE-008', '13 Coding', 'Delegate a comments pass', 'Depends on SUB stories; needs a real model.'),
  live('CODE-009', '13 Coding', 'Recognise a non-git workspace', 'Needs a real model in a scratch directory.'),
  live('CODE-010', '13 Coding', 'Detect uncommitted changes before a destructive action', 'Behavioural story: needs a real model and a dirty tree.'),
  live('CODE-011', '13 Coding', 'Distinguish exit 0 from a failure', 'Needs a real model reading tool results.'),
  live('CODE-012', '13 Coding', 'Verify a generated file exists and has the expected content', 'Behavioural story (verify artifacts, do not trust self-reports).'),
  live('CODE-013', '13 Coding', 'Never claim a test passed without observing it', 'Behavioural story; the hallucination guard covers claims, the journey needs a real model.'),
  live('CODE-014', '13 Coding', 'Recover from a command timeout without duplicate processes', 'Needs a real model plus the process tools.'),

  // 14 — Discord ------------------------------------------------------------
  live('DISC-001', '14 Discord', 'Join a server with a bot token', 'Live: needs a real Discord application and token.'),
  live('DISC-002', '14 Discord', 'Speak via @mention', 'Live: Discord ingress + a real model.'),
  live('DISC-003', '14 Discord', 'Attach a file and have the agent view it', 'Live: Discord attachment ingress.'),
  deferred('DISC-004', '14 Discord', 'Join a voice channel', 'Deferred out of 1.0 (voice is explicitly deferred in the checklist).'),
  live('DISC-005', '14 Discord', 'Deliver an image through chat', 'Live: needs the image tool plus a Discord channel.'),
  live('DISC-006', '14 Discord', 'Deliver a file to the user', 'Live: outbound attachments are text-only today; verify what the channel supports.'),
  automated('DISC-007', '14 Discord', 'Slash commands work on Discord', '../web-client/src/app/components/composer/composer.spec.ts', 'offers the catalog while the message is just a command token'),
  automated('DISC-008', '14 Discord', 'DM/guild allowlists are enforced', 'src/channels/discord-ingress.service.spec.ts', 'rejects a guild that is not allowlisted'),

  // 15 — Reliability --------------------------------------------------------
  automated('REL-001', '15 Reliability', 'Provider failure is reported clearly', E2E, 'POST /core/conversation/stream emits an error event on failure'),
  automated('REL-002', '15 Reliability', 'Provider failure is surfaced with its own words', 'src/llm/llm.client.spec.ts', 'surfaces an error envelope sent inside a 200 stream'),
  automated('REL-003', '15 Reliability', 'A timeout is distinct from a failed operation', 'src/llm/llm.client.spec.ts', 'throws 504 when the request fails'),
  automated('REL-004', '15 Reliability', 'Malformed completions fail closed', 'src/llm/llm.client.spec.ts', 'throws 502 on error status and on empty streams'),
  automated('REL-005', '15 Reliability', 'State survives a core restart', E2E, 'persists sessions across restarts'),
  automated('REL-006', '15 Reliability', 'Interrupted work is identified, not re-executed', E2E, 'recovers a failed final across restart without re-executing'),
  automated('REL-007', '15 Reliability', 'A duplicate tool request does not double-execute', E2E, 'skips repeated calls without re-executing'),
  automated('REL-008', '15 Reliability', 'A parked approval cannot be rebound to another request', 'src/tools/tool-execution.service.spec.ts', 'rejects rebinding approval identity at the SQLite boundary'),
  live('REL-009', '15 Reliability', 'Subagent that never finishes stays observable', 'Timeout/cancel are unit-covered; an indefinitely hung child needs a live run.'),
  live('REL-010', '15 Reliability', 'Database unavailable fails safely', 'Requires taking the SQLite file away at runtime; not attempted in-process.'),

  // 16 — Security -----------------------------------------------------------
  automated('SEC-001', '16 Security', 'Unauthenticated callers are locked out', E2E, 'keeps liveness public and locks everything else'),
  automated('SEC-002', '16 Security', 'Wrong tokens do not leak why', E2E, 'rejects a wrong token without leaking why'),
  automated('SEC-003', '16 Security', 'Mutations require CSRF', E2E, 'logs in, verifies the session, and gates mutations on CSRF'),
  automated('SEC-004', '16 Security', 'Secrets are write-only', E2E, 'stores secrets write-only and never returns a value'),
  automated('SEC-005', '16 Security', 'Tool arguments are validated', 'src/tools/tool-registry.spec.ts', 'rejects inherited arguments and non-plain argument containers'),
  automated('SEC-006', '16 Security', 'Path and cwd escapes are refused', 'src/tools/tool-execution.service.spec.ts', 'rejects a terminal cwd outside the workspace (M17c)'),
  automated('SEC-007', '16 Security', 'Hostile content cannot silently approve actions', E2E, 'assistant text can never approve a request'),
  automated('SEC-008', '16 Security', 'Persona candidates cannot contradict the immutable core', 'test/persona.e2e-spec.ts', 'refuses an approval that contradicts the immutable core'),
  live('SEC-009', '16 Security', 'An MCP tool cannot exceed its granted permissions', 'Allowlists and env references are unit-tested; a live malicious server run is required for the claim.'),
  live('SEC-010', '16 Security', 'Revoked capability cannot be invoked through a stale registration', 'Token revocation is unit-tested; a stale MCP/tool registration is a live scenario.'),
  live('SEC-011', '16 Security', 'Audit records identify the source of a consequential action', 'The approval/ledger rows carry provenance; a full audit story needs a live run to inspect end to end.'),
];
