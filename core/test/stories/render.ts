import { STORIES } from './registry';
import type { Story } from './registry';

/**
 * Render the FG5 traceability matrix. The registry is the single source of
 * truth; `registry.e2e-spec.ts` fails when the committed file drifts from it.
 */
export function renderStories(stories: readonly Story[] = STORIES): string {
  const areas = [...new Set(stories.map((story) => story.area))];
  const counts = {
    automated: stories.filter((story) => story.status === 'automated').length,
    live: stories.filter((story) => story.status === 'live').length,
    deferred: stories.filter((story) => story.status === 'deferred').length,
  };

  const lines: string[] = [
    '# Release 1.0 — user-story traceability',
    '',
    '> Status: **generated** from `core/test/stories/registry.ts` by',
    '> `npm run stories:render` (in `core/`). Do not edit by hand; `npm run test:e2e`',
    '> fails when this file and the registry disagree.',
    '',
    `**${stories.length} stories** — ${counts.automated} automated, ${counts.live} live-only, ` +
      `${counts.deferred} deferred.`,
    '',
    'A story is complete when its expected behaviour has been exercised in the intended',
    'configuration and the result recorded. `automated` cites a test that the registry',
    'spec re-checks on every run; `live` names the configuration a human run needs;',
    '`deferred` is a deliberate exclusion with its reason.',
    '',
  ];

  for (const area of areas) {
    const inArea = stories.filter((story) => story.area === area);
    lines.push(`## ${area}`, '');
    lines.push('| ID | Story | Status | Evidence / reason |');
    lines.push('| --- | --- | --- | --- |');
    for (const story of inArea) {
      const evidence =
        story.status === 'automated' && story.proof
          ? `\`${story.proof.file}\` — “${story.proof.test}”`
          : (story.note ?? '');
      lines.push(
        `| **${story.id}** | ${story.title} | ${story.status} | ${escapeCell(evidence)} |`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}
