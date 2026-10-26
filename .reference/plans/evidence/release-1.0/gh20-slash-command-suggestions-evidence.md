# GH20 — slash-command suggestions in the composer

> Status: **verified** (2026-10-26)

Issue: <https://github.com/robjvan/icos/issues/20> — *"Web UI missing slash
command suggestions (Discord/Opencode-style)"*: typing `/` showed nothing,
so the command set had to be remembered.

## What changed

**Core — catalog endpoint**

- `GET /core/commands` returns `{ commands: [{ name, description }] }` from the
  dispatcher's existing registry (`commandDescriptors`), so the client can never
  drift from what the runtime actually dispatches. Read-only, no side effects,
  behind the normal auth guard. New `CommandsController` registered in
  `ConversationModule`.

**Web — suggestions**

- New `CommandCatalogService` fetches the catalog once and caches it; a failure
  degrades to "no suggestions" — the chat is never blocked by it.
- The composer opens a menu while the message is **still only the command token**
  (`/`, `/mo`, …). Once a space follows (`/model deepseek`) the list closes, since
  it is an argument at that point.
- Keyboard: `↑`/`↓` move (wrapping), `Enter`/`Tab` insert the highlighted
  command **without sending**, `Esc` dismisses, blur closes. Clicking a row
  inserts it too (`mousedown` is prevented so focus stays in the box).
- Inserting writes `/<name> ` with the caret after the space, ready for arguments.
- ARIA: the textarea is a `combobox` with `aria-autocomplete="list"`,
  `aria-expanded`, `aria-controls`, and `aria-activedescendant`; the menu is a
  `listbox` of `option`s with `aria-selected`.
- Styling follows the app tokens: sage tint plus an accent bar on the active row,
  names in mono, descriptions muted, scrollable with `overscroll-behavior:
  contain`.

## Verification

**Unit** — core `npm test`: **1301 passed** (1 deliberate skip); `tsc` and
`eslint` clean. Web `ng test`: **55 files, 242 passed** (was 233):

- composer: offers the catalog for `/`, filters `/mo` → `/model`, closes once an
  argument follows, `Enter` completes the highlighted row **without submitting**,
  arrow keys wrap, `Esc` closes and leaves the typed text, clicking a row
  inserts, blur dismisses;
- `CommandCatalogService`: caches after one fetch and resolves to `[]` when the
  endpoint fails.

`npm run lint` and `npm run build` clean.

**E2E** — `npm run test:e2e`: **76 passed**. New spec asserts `/core/commands`
returns a sorted, described catalog containing the builtin commands.

**Live** — rebuilt core + web client, real Chromium against the compose stack:

| Check | Result |
| --- | --- |
| Typing `/` | menu lists all **15** catalog commands (scrollable) |
| `ArrowDown` | `/compact` highlighted (visible tint + accent bar) |
| `Enter` | input becomes `/compact `, menu closes, **no message sent** |
| Typing `/mo` | menu narrows to `/model` |
| `Esc` | menu closes, typed text preserved |

Screenshot: `gh20-slash-suggestions.png`.

## Honest remainder

- Matching is **prefix-only**, not fuzzy; `/xt` will not suggest `/export`.
- There is **no argument completion** — `/model <provider> <model>` still has to
  be typed (the Models tab remains the discoverable place for provider ids).
- The reference screenshot shows per-command keyboard shortcuts (⌘⇧S, ⌘+', ⌘+;).
  ICOS has no keybindings for these commands, so none are displayed.
- `GET /core/commands` includes aliases? No: `commandDescriptors` returns
  canonical names only, sorted — which is the list the menu renders.
