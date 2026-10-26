import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STORIES } from './registry';
import type { Story } from './registry';
import { renderStories } from './render';

/**
 * FG5 — the suite is only green if every story is accounted for:
 *
 *  - ids are unique and well formed;
 *  - each story is automated, live, or deferred — and the latter two carry a
 *    reason (no silent gaps);
 *  - every `automated` proof points at a file that exists and still contains
 *    the named test;
 *  - the committed traceability matrix matches the registry.
 */
const CORE_ROOT = join(__dirname, '..', '..');
const MATRIX = join(
  CORE_ROOT,
  '..',
  '.reference',
  'plans',
  'release-1.0-story-matrix.md',
);

describe('FG5 user-story registry', () => {
  it('assigns unique, well-formed ids', () => {
    const ids = STORIES.map((story) => story.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Z]{2,6}-\d{3}$/);
    }
  });

  it('decides every story: automated, live, or deferred with a reason', () => {
    const undecided = STORIES.filter((story) => {
      if (story.status === 'automated') return !story.proof;
      return !story.note || story.note.trim().length < 20;
    });
    expect(undecided.map((story) => story.id)).toEqual([]);
    expect(STORIES.some((story) => story.status === 'automated')).toBe(true);
    expect(STORIES.some((story) => story.status === 'live')).toBe(true);
  });

  it('cites a test that exists for every automated story', () => {
    const missing: string[] = [];
    for (const story of STORIES) {
      if (story.status !== 'automated' || !story.proof) continue;
      const file = join(CORE_ROOT, story.proof.file);
      if (!existsSync(file)) {
        missing.push(`${story.id}: file ${story.proof.file}`);
        continue;
      }
      const source = readFileSync(file, 'utf8');
      const needle = `it('${story.proof.test}'`;
      if (!source.includes(needle)) {
        missing.push(`${story.id}: ${story.proof.file} :: ${story.proof.test}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps the committed traceability matrix in step with the registry', () => {
    expect(existsSync(MATRIX)).toBe(true);
    expect(readFileSync(MATRIX, 'utf8')).toBe(renderStories(STORIES));
  });

  it('reports the coverage split', () => {
    const counts = (status: Story['status']): number =>
      STORIES.filter((story) => story.status === status).length;
    // A guard rail for the release conversation, not a target.
    expect(counts('automated')).toBeGreaterThan(30);
    expect(counts('live') + counts('deferred')).toBeLessThan(STORIES.length);
  });
});
