# Release 1.0 — user-story traceability

> Status: **generated** from `core/test/stories/registry.ts` by
> `npm run stories:render` (in `core/`). Do not edit by hand; `npm run test:e2e`
> fails when this file and the registry disagree.

**109 stories** — 67 automated, 37 live-only, 5 deferred.

A story is complete when its expected behaviour has been exercised in the intended
configuration and the result recorded. `automated` cites a test that the registry
spec re-checks on every run; `live` names the configuration a human run needs;
`deferred` is a deliberate exclusion with its reason.

## 00 Launch

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **BOOT-001** | The stack launches in every supported configuration | live | 18-cell model/verifier matrix (cloud, DMR, Ollama exact) documented in .reference/notes/release-1.0-user-stories.md; 3 cells passed so far. Each cell needs a real model + compose run. |
| **BOOT-002** | The stack shuts down cleanly | live | bin/stack-local down / docker compose down; graceful shutdown is observable in the core log ("Channel presence: offline"). Not automatable inside the test process. |

## 01 Chat

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **CHAT-001** | Log in and hold a text conversation | automated | `test/app.e2e-spec.ts` — “POST /core/conversation returns a reply and session id” |
| **CHAT-002** | Log out securely | automated | `test/app.e2e-spec.ts` — “clears both cookies on logout” |
| **CHAT-003** | Browse and delete past sessions | automated | `test/app.e2e-spec.ts` — “SESS-001: deletes a session and its transcript” |
| **CHAT-004** | Browse sessions newest-first with previews | automated | `test/app.e2e-spec.ts` — “GET /core/sessions lists sessions newest-first” |
| **CHAT-005** | Attach a photo; the reference reaches the model | automated | `test/app.e2e-spec.ts` — “uploads an attachment, serves it back, and carries it into a turn” |
| **CHAT-006** | Attach a document and have the agent read it | live | The attachment is stored and referenced, but no text extraction exists: the model receives a reference, not the contents. Live check pending a document-extraction capability. |
| **CHAT-007** | Attach an audio file and have the agent hear it | deferred | Audio is not in the attachment allowlist and no transcription exists. |
| **CHAT-008** | Ask for an attached file to be saved in the KB | deferred | No KB-save action exists (KB is a bridge, not a writable store from chat). |
| **CHAT-009** | Request a generic message by email | live | Needs a configured email channel (SMTP/Brevo) and an allowlisted operator address; verified in live runs, not in CI. |
| **CHAT-010** | Request a system report by email | live | Same as CHAT-009: builds on /health data plus the email channel; live only. |
| **CHAT-011** | Request a system audit by email | deferred | No audit report exists; the definition is still open in the checklist. |
| **CHAT-012** | Attach a file and have it sent to the inbox | deferred | Depends on outbound attachments (channel.send carries text only) plus email configuration. |
| **CHAT-013** | Slash commands work in the chat UI | automated | `test/app.e2e-spec.ts` — “slash commands answer without LLM, transcript, or extraction” |
| **CHAT-014** | Slash commands offer suggestions | automated | `test/app.e2e-spec.ts` — “lists the slash-command catalog for the composer (GH20)” |
| **CHAT-015** | The suggestion list filters and completes without sending | automated | `../web-client/src/app/components/composer/composer.spec.ts` — “accepts the highlighted command on Enter without sending” |

## 02 Usability

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **UX-001** | Swap between light and dark themes | automated | `../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts` — “should switch themes through the theme service” |
| **UX-002** | Change the health polling interval | automated | `../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts` — “should persist the health poll interval through the health service” |
| **UX-003** | Current time renders in the local timezone | automated | `../web-client/src/app/components/footer-component/footer-component.spec.ts` — “should render live CPU and RAM from the health service” |
| **UX-004** | Font, sizing, positioning, and colour are consistent | live | Judgement call over many surfaces; GH21 evidence records the computed-style comparison and AXE run for MCP/Models, and the shared rules in styles.css are the mechanism. |
| **UX-005** | Tab content layout is consistent across the UI | live | Same as UX-004: GH21 evidence covers the shared .tab-pane/.grid/.editor rules; no automated cross-tab visual check. |

## 03 Memory

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **MEM-001** | View memory candidates | automated | `test/app.e2e-spec.ts` — “GET /core/memory-candidates exposes extracted candidates” |
| **MEM-002** | Approve a candidate (promotion) | automated | `test/app.e2e-spec.ts` — “promotes a candidate to a belief on approval plus sweep” |
| **MEM-003** | Reject a candidate | automated | `../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts` — “rejects a candidate through the service (MEM-003)” |
| **MEM-004** | Bulk approve candidates | automated | `../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts` — “bulk-approves after an inline confirmation (MEM-004)” |
| **MEM-005** | Bulk reject candidates | automated | `../web-client/src/app/components/memory-review-queue/memory-review-queue.spec.ts` — “bulk-rejects after an inline confirmation (MEM-005)” |
| **MEM-006** | Run a promotion sweep | automated | `test/app.e2e-spec.ts` — “runs belief maintenance explicitly with a durable summary” |
| **MEM-007** | A useful, novel candidate is generated from a turn | automated | `test/app.e2e-spec.ts` — “GET /core/memory-candidates exposes extracted candidates” |
| **MEM-008** | Candidates are validated before they are stored | automated | `src/memory/candidate-validation.spec.ts` — “rejects non-array, non-object input” |
| **MEM-009** | A duplicate candidate converges instead of duplicating | automated | `src/memory/promotion.service.spec.ts` — “converges a repeated triple to REINFORCE, never a second claim” |
| **MEM-010** | A contradiction is handled explicitly | automated | `test/app.e2e-spec.ts` — “contradicts a belief and parks a prospective question” |
| **MEM-011** | A denial promotes nothing | automated | `src/memory/promotion.service.spec.ts` — “denies cleanly: no claim, no retry” |
| **MEM-012** | Auto-approval follows the promotion policy | automated | `src/memory/promotion.service.spec.ts` — “auto-commits admitted NEW kinds without approval when opted in” |
| **MEM-013** | A promoted memory is retrievable when relevant | automated | `test/app.e2e-spec.ts` — “traces turn-time recall per session for inspection” |
| **MEM-014** | Memory decay affects retrieval or salience | live | Decay is implemented in the maintenance pass (rank/maintenance specs cover decay maths); no end-to-end story asserts the retrieval effect over time. |
| **MEM-015** | Expired or superseded memories never silently become authoritative | live | Supersession is covered by contradiction tests and claim history; a time-based expiry story is not exercised end to end. |
| **MEM-016** | Provenance survives promotion | automated | `src/memory/promotion.service.spec.ts` — “commits on approval via sweep with provenance intact” |
| **MEM-017** | A failed promotion leaves no partial state | automated | `src/memory/promotion.service.spec.ts` — “proposes each candidate exactly once” |

## 04 Models

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **MODEL-001** | List providers/models | automated | `test/app.e2e-spec.ts` — “lists providers (no keys), stores the referenced key, switches active” |
| **MODEL-002** | Switch provider/model without a reload | automated | `test/app.e2e-spec.ts` — “lists providers (no keys), stores the referenced key, switches active” |

## 05 Cron

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **CRON-001** | View existing cron jobs | automated | `test/app.e2e-spec.ts` — “CRON-001: creates, pauses, resumes, runs, and deletes a cron job” |
| **CRON-002** | Create, pause, resume, and delete a job | automated | `test/app.e2e-spec.ts` — “CRON-001: creates, pauses, resumes, runs, and deletes a cron job” |
| **CRON-003** | Fire a job on demand | automated | `test/app.e2e-spec.ts` — “CRON-001: creates, pauses, resumes, runs, and deletes a cron job” |
| **CRON-004** | Invalid schedules and unknown ids are rejected | automated | `test/app.e2e-spec.ts` — “CRON-002: rejects a malformed job and unknown ids” |

## 06 Skills

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **SKILL-001** | View loaded skills | automated | `test/app.e2e-spec.ts` — “skills refresh/show round-trips a filesystem fixture” |
| **SKILL-002** | Create, edit, and delete a skill | automated | `test/app.e2e-spec.ts` — “SKILL-001: creates, edits, reads back, and deletes a skill” |
| **SKILL-003** | Skills are selected and injected per turn | automated | `test/app.e2e-spec.ts` — “M7c turn scopes: explicit pins, one-shot pulls, contextual discovery” |

## 07 Tools

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **TOOL-001** | View the global tool inventory | automated | `test/app.e2e-spec.ts` — “TOOL-001: lists the tool inventory and discovery bounds” |
| **TOOL-002** | Toggle auto-approval | automated | `test/app.e2e-spec.ts` — “TOOL-002: toggles auto-approve and refuses unknown tools” |
| **TOOL-003** | A policy-disabled tool is never offered | automated | `src/tools/tool-surface.service.spec.ts` — “never surfaces a policy-disabled tool” |

## 08 MCP

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **MCP-001** | View configured MCP servers | automated | `test/app.e2e-spec.ts` — “logs in, verifies the session, and gates mutations on CSRF” |
| **MCP-002** | Add and delete an MCP server | automated | `test/app.e2e-spec.ts` — “logs in, verifies the session, and gates mutations on CSRF” |
| **MCP-003** | Enable/disable an MCP server (restart to unload) | live | Configured entries reload without a restart, but the enabled flag and tool unload are a live operation against a real MCP server. |
| **MCP-004** | Ask the agent which MCP servers are available | live | Needs a real model turn; the catalog is exposed as tool context. |
| **MCP-005** | Ask the agent which tools a server exposes | live | Needs a real model turn plus a live MCP connection (bytestash). |
| **MCP-006** | Ask the agent to fire an MCP tool | live | Needs a real model turn plus a live MCP connection. |

## 09 Client settings

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **SET-001** | Client settings persist | automated | `../web-client/src/app/components/client-settings-tab/client-settings-tab.spec.ts` — “should persist the health poll interval through the health service” |

## 10 Server settings

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **SET-002** | Server settings are readable and guarded | automated | `test/app.e2e-spec.ts` — “keeps liveness public and locks everything else” |

## 11 Tool usage

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **USE-001** | The system runs tools | automated | `test/app.e2e-spec.ts` — “executes a search turn against the real transcript, scoped to the session” |
| **USE-002** | Repeated identical calls are not re-executed | automated | `test/app.e2e-spec.ts` — “skips repeated calls without re-executing” |
| **USE-003** | A rejected proposal is recovered with corrected arguments | automated | `test/app.e2e-spec.ts` — “recovers from a rejected proposal with corrected arguments” |

## 12 Subagents

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **SUB-001** | Delegate a task to a subagent | automated | `src/subagents/subagent-runner.service.spec.ts` — “spawns a child and completes it with a truncated summary” |
| **SUB-002** | Track the status of a delegated task | automated | `src/subagents/subagent-runner.service.spec.ts` — “parks on approval and reconciles on completion” |
| **SUB-003** | Cancel a delegated task | automated | `src/subagents/subagent-runner.service.spec.ts` — “cancels cooperatively and leaves terminal states alone” |
| **SUB-004** | A child failure is reported, never hidden | automated | `src/subagents/subagent-runner.service.spec.ts` — “records a child throw as failed, never escaping” |

## 13 Coding

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **CODE-001** | Read the repo, branch, and status | live | Needs a real model driving terminal/git tools in the workspace. |
| **CODE-002** | Read and write a file in the repo | live | Needs a real model; the tools are covered by unit tests, the journey is not. |
| **CODE-003** | Notice a failed write and retry | live | Behavioural story: needs a real model and a forced write failure. |
| **CODE-004** | Take git actions (clone/commit/push) | live | Needs a real model and a disposable remote. |
| **CODE-005** | Produce an HTML/CSS/JS mockup and screenshot it | live | Needs a real model plus the browser tool render loop. |
| **CODE-006** | Run version checks (node/npm/docker/ng/nest/flutter) | live | Needs a real model driving the terminal tool. |
| **CODE-007** | Run a Nest app, inspect its log, stop it | live | Needs a real model plus the process tools. |
| **CODE-008** | Delegate a comments pass | live | Depends on SUB stories; needs a real model. |
| **CODE-009** | Recognise a non-git workspace | live | Needs a real model in a scratch directory. |
| **CODE-010** | Detect uncommitted changes before a destructive action | live | Behavioural story: needs a real model and a dirty tree. |
| **CODE-011** | Distinguish exit 0 from a failure | live | Needs a real model reading tool results. |
| **CODE-012** | Verify a generated file exists and has the expected content | live | Behavioural story (verify artifacts, do not trust self-reports). |
| **CODE-013** | Never claim a test passed without observing it | live | Behavioural story; the hallucination guard covers claims, the journey needs a real model. |
| **CODE-014** | Recover from a command timeout without duplicate processes | live | Needs a real model plus the process tools. |

## 14 Discord

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **DISC-001** | Join a server with a bot token | live | Live: needs a real Discord application and token. |
| **DISC-002** | Speak via @mention | live | Live: Discord ingress + a real model. |
| **DISC-003** | Attach a file and have the agent view it | live | Live: Discord attachment ingress. |
| **DISC-004** | Join a voice channel | deferred | Deferred out of 1.0 (voice is explicitly deferred in the checklist). |
| **DISC-005** | Deliver an image through chat | live | Live: needs the image tool plus a Discord channel. |
| **DISC-006** | Deliver a file to the user | live | Live: outbound attachments are text-only today; verify what the channel supports. |
| **DISC-007** | Slash commands work on Discord | automated | `../web-client/src/app/components/composer/composer.spec.ts` — “offers the catalog while the message is just a command token” |
| **DISC-008** | DM/guild allowlists are enforced | automated | `src/channels/discord-ingress.service.spec.ts` — “rejects a guild that is not allowlisted” |

## 15 Reliability

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **REL-001** | Provider failure is reported clearly | automated | `test/app.e2e-spec.ts` — “POST /core/conversation/stream emits an error event on failure” |
| **REL-002** | Provider failure is surfaced with its own words | automated | `src/llm/llm.client.spec.ts` — “surfaces an error envelope sent inside a 200 stream” |
| **REL-003** | A timeout is distinct from a failed operation | automated | `src/llm/llm.client.spec.ts` — “throws 504 when the request fails” |
| **REL-004** | Malformed completions fail closed | automated | `src/llm/llm.client.spec.ts` — “throws 502 on error status and on empty streams” |
| **REL-005** | State survives a core restart | automated | `test/app.e2e-spec.ts` — “persists sessions across restarts” |
| **REL-006** | Interrupted work is identified, not re-executed | automated | `test/app.e2e-spec.ts` — “recovers a failed final across restart without re-executing” |
| **REL-007** | A duplicate tool request does not double-execute | automated | `test/app.e2e-spec.ts` — “skips repeated calls without re-executing” |
| **REL-008** | A parked approval cannot be rebound to another request | automated | `src/tools/tool-execution.service.spec.ts` — “rejects rebinding approval identity at the SQLite boundary” |
| **REL-009** | Subagent that never finishes stays observable | live | Timeout/cancel are unit-covered; an indefinitely hung child needs a live run. |
| **REL-010** | Database unavailable fails safely | live | Requires taking the SQLite file away at runtime; not attempted in-process. |

## 16 Security

| ID | Story | Status | Evidence / reason |
| --- | --- | --- | --- |
| **SEC-001** | Unauthenticated callers are locked out | automated | `test/app.e2e-spec.ts` — “keeps liveness public and locks everything else” |
| **SEC-002** | Wrong tokens do not leak why | automated | `test/app.e2e-spec.ts` — “rejects a wrong token without leaking why” |
| **SEC-003** | Mutations require CSRF | automated | `test/app.e2e-spec.ts` — “logs in, verifies the session, and gates mutations on CSRF” |
| **SEC-004** | Secrets are write-only | automated | `test/app.e2e-spec.ts` — “stores secrets write-only and never returns a value” |
| **SEC-005** | Tool arguments are validated | automated | `src/tools/tool-registry.spec.ts` — “rejects inherited arguments and non-plain argument containers” |
| **SEC-006** | Path and cwd escapes are refused | automated | `src/tools/tool-execution.service.spec.ts` — “rejects a terminal cwd outside the workspace (M17c)” |
| **SEC-007** | Hostile content cannot silently approve actions | automated | `test/app.e2e-spec.ts` — “assistant text can never approve a request” |
| **SEC-008** | Persona candidates cannot contradict the immutable core | automated | `test/persona.e2e-spec.ts` — “refuses an approval that contradicts the immutable core” |
| **SEC-009** | An MCP tool cannot exceed its granted permissions | live | Allowlists and env references are unit-tested; a live malicious server run is required for the claim. |
| **SEC-010** | Revoked capability cannot be invoked through a stale registration | live | Token revocation is unit-tested; a stale MCP/tool registration is a live scenario. |
| **SEC-011** | Audit records identify the source of a consequential action | live | The approval/ledger rows carry provenance; a full audit story needs a live run to inspect end to end. |
