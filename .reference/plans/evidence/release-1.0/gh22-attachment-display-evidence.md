# GH22 — attachments visible on the transcript

> Status: **verified** (2026-10-23)

Issue: <https://github.com/robjvan/icos/issues/22> — *"Show uploaded attachments
in web chat UI"*: an attachment is uploaded and sent, then stripped from the view,
so a past upload cannot be found again.

## What was missing

Attachments existed only for the duration of a turn. The `messages` row was
text-only, so the transcript had nothing to draw after a reload, and the web
client dropped the field even when the API returned it.

## What changed

**Core — persistence**

- `messages` gains a nullable `attachments` column (additive migration via
  `addColumnIfMissing`, so existing databases upgrade in place).
- The turn's references are written with the user row: `renderTurn` →
  `completeTextTurn`/`persistTurn` → `SessionStore.append(...)` carries the
  attachments through both the text and tool paths.
- Stored metadata is normalised and bounded: url ≤ 2048 chars, name ≤ 120,
  content type ≤ 100, at most 20 per message, entries without a url dropped.
  A malformed reference can never land in the transcript.
- History returns them. **LLM context is unchanged** — attachments already
  travel as their own band and as vision parts; nothing new reaches the model.

**Web — rendering**

- `ChatMessage`/`ConversationHistoryResponse` carry `attachments`; the store
  keeps them for both the live append and the history reload.
- New `message-attachments` strip under the bubble:
  - image → 88×66 thumbnail, links to the full file;
  - video → tile with a film-strip overlay;
  - audio → music note; document → text file; archive → archive; unknown →
    question mark — each with the filename and a human size.
- Previews are fetched with the session cookie and shown as object URLs, so
  they work across the `:4200` → `:3000` origin split. The client **refuses to
  fetch anything that is not a stored `/core/attachments/<uuid>` reference**, so
  a transcript can never make the browser request an arbitrary URL with
  credentials.

## Verification

**Unit** — core `npm test`: **1301 passed** (1299 + 2 new repository tests;
1 deliberate skip). New: attachments round-trip on a message, and bounding /
sanitising (20 max, empty-url dropped, long url clipped).

**E2E** — `npm run test:e2e`: **75 passed**. The existing upload-and-turn spec
now also asserts the history returns the reference.

**Web** — `ng test`: **53 files, 233 passed** (230 + 3). New: store keeps
attachments on the user message and forwards them to the stream; message list
renders the strip only when files exist; `message-attachments` classifies by
type then extension, fetches only previewable kinds, and falls back to an icon;
`AttachmentService.preview` fetches a stored reference with credentials and
refuses absolute/traversal URLs without touching `fetch`.

`npm run lint` and `npm run build` clean; core `eslint` and `tsc` clean.

**Live** — rebuilt core (migration applied to the real `~/.icos/data/sessions.db`)
and web client, then:

| Check | Result |
| --- | --- |
| `GET /core/conversation/<id>` returns the attachment | yes (url/name/type/size) |
| Strip renders under the user bubble | yes, right-aligned |
| Thumbnail loads through the authenticated endpoint | yes (`blob:` object URL, 107 KB file) |
| Size label | `107 KB` |

Screenshot: `gh22-attachments.png`.

## Honest remainder

- The live turn itself could not be used: the local DMR backend was wedged
  (model reload / compute OOM on a 16 GB host), so no LLM turn completed. The
  transcript for the live check was **seeded** with a real uploaded attachment
  and then read back through the production history API and the production UI —
  the display path is real, the turn that produced it is not.
- The core does not observe a transcript row written by *another process* until
  it restarts (its SQLite connection keeps its own view). That is fine in
  normal operation — core is the only writer — but it means the seed needed a
  core restart before it was visible. Worth remembering when inspecting the DB
  by hand.
- Uploads are limited by the existing allowlist (images, PDF, text, markdown,
  JSON), so the archive/video/audio tiles are exercised by unit tests and by
  history rows, not by a real upload through this endpoint.
- Drag-and-drop and paste-to-attach were not added; the paperclip remains the
  only input path.
