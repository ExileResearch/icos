# GH21 — MCP and Models tab typography, spacing, and edit dialogs

> Status: **verified** (2026-10-22)

Issue: <https://github.com/robjvan/icos/issues/21> — *"Styling is still off on
MCP and Models tabs"*: font sizing and spacing differ from the Tools tab, which
the issue names as the reference.

## What was actually wrong

M20b moved the pane shell (`padding`, `header`, `badge`) into `styles.css`, and
those were correct. What it did **not** cover is everything below the header:

1. **Tables inherited the 16 px page base.** `.grid` was defined inside
   `mcp-tab.css` and `models-tab.css` with padding and rules but no
   typography, and Angular scoping meant neither copy reached the other tab.
   Measured live: `th` 16 px / 700, `td` 16 px — every other tab's body copy is
   13 px.
2. **`.hint` did not exist for the Models tab.** It was defined separately in
   five component stylesheets (tools, agents, server, client, settings modal) and
   **not** in `models-tab`, so the provider hints rendered at 16 px.
3. **The editors were inline, unstyled forms** — and were meant to be dialogs.
   `.modal-backdrop` / `.modal` already exist in `styles.css` ("reused by any
   tab"), and both tabs ignored them. Native inputs at 16 px, no focus
   management, no Escape, no backdrop.
4. **`width: 100%` hit the "Enabled" checkbox**, so the label stacked under a
   full-width checkbox.

## What changed

Shared rules in `web-client/src/styles.css` (the only place they can work for
more than one component):

- `.hint` — 13 px, secondary, `line-height: 1.5`.
- `.sr-only` — the visually-hidden utility (was triplicated).
- `.grid` — 13 px body, 11 px uppercase secondary headers, aligned padding.
- `.editor` typography — labels, `h2`, and controls at the house scale.
- `.modal-head` — dialog title row.

Then the duplicates were deleted from `mcp-tab`, `models-tab`, `tools-tab`,
`agents-tab`, `server-settings-tab`, `client-settings-tab`, `settings-modal`.

**Editors became real dialogs** in both tabs: `modal-backdrop` → `modal` with
`role="dialog"`, `aria-modal`, `aria-labelledby` to the heading, click-outside
to close, `Escape` via a host listener, focus moved into the dialog on open and
returned to the triggering button on close (including after a successful save).

Also fixed in passing: the Models "Active selection" panel had no styles at all
(unstyled `fieldset`/rows), and the provider `<select>` was too narrow to read.

## Verification

**Measured live** (headless Chromium against the compose stack, computed
styles):

| | before | after |
| --- | --- | --- |
| `.grid th` | 16 px, 700, no transform | 11 px, 600, uppercase, secondary |
| `.grid td` | 16 px, 5.6 px / 8 px padding | 13 px, 8.8 px / 9.6 px |
| Models `.hint` | 16 px | 13 px |
| Tools `.hint` (reference) | 13 px | 13 px |

**Unit** — `ng test`: **52 files, 224 tests passed**.

New dialog tests (5): MCP 3, Models 2 — opens as a labelled `role="dialog"`
with `aria-modal` and a backdrop; Escape closes it and returns focus to the
trigger; a backdrop click closes it while a click inside does not.

`npm run lint` clean, `npm run build` clean.

**AXE** (axe-core 4, WCAG 2 A/AA + best-practice) on `/mcp` and `/models`, each
in the tab state and with its dialog open: **0 violations** in all four states.

**Screenshots** (light/dark theme follows the stored preference; captured dark):
`gh21-mcp.png`, `gh21-mcp-dialog.png`, `gh21-models.png`,
`gh21-models-dialog.png`, `gh21-tools.png` (reference).

## Honest remainder

- Promoting `.hint` also raises two other hints from 12 px to 13 px
  (settings modal, Client tab). That is the intended consolidation — one hint
  size — but it is a visible change outside the two tabs in the issue.
- `/server` shares the promoted `.grid` / `.editor` rules; it was not
  screenshotted, though it previously carried an identical copy of `.grid`.
- Only the dark theme was captured. The rules use existing tokens, and
  `browser.lighthouse`/AXE ran on the default theme.
- The editors still use the hand-rolled modal pattern (backdrop + focus), not a
  focus trap. That matches every other dialog in the app; a trap would be a
  separate change across all of them.
