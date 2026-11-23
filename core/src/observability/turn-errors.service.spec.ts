import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CoreConfig } from '../config';
import { LlmError } from '../llm/llm.client';
import { SessionDatabaseService } from '../session/session-database.service';
import { TurnErrorsService } from './turn-errors.service';

describe('TurnErrorsService (R1)', () => {
  let dir: string;
  let database: SessionDatabaseService;
  let service: TurnErrorsService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'icos-turn-errors-'));
    database = new SessionDatabaseService({
      sessionDbPath: join(dir, 'sessions.sqlite'),
    } as CoreConfig);
    database.onModuleInit();
    service = new TurnErrorsService(database);
  });

  afterEach(() => {
    database.onModuleDestroy();
    rmSync(dir, { recursive: true, force: true });
  });

  it('counts failures by bucket inside the window', () => {
    service.recordError(new LlmError(502, 'down', true, undefined, 'http'));
    service.recordError(
      new LlmError(502, 'invalid', false, undefined, 'malformed'),
    );
    service.recordToolFailure('terminal_failed');
    service.record({
      bucket: 'unknown',
      code: 'mystery',
      detail: 'line one\nline two',
    });

    const counts = service.counts();
    expect(counts.total).toBe(4);
    expect(counts.byBucket).toMatchObject({
      provider_http: 1,
      malformed_completion: 1,
      tool_failure: 1,
      unknown: 1,
    });
    expect(counts.last).toMatchObject({ bucket: 'unknown', code: 'mystery' });
  });

  it('excludes rows outside the window', () => {
    service.record({ bucket: 'provider_http', code: 'http' });
    database.connection
      .prepare('UPDATE turn_errors SET at = ?')
      .run(new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    expect(service.counts(24 * 60 * 60 * 1000).total).toBe(0);
    expect(service.counts(72 * 60 * 60 * 1000).total).toBe(1);
  });

  it('counts tool-syntax leakage without treating it as a failure', () => {
    service.checkReplyLeak('here: <|dsml|>tool_calls');
    service.checkReplyLeak('a normal reply');

    const counts = service.counts();
    expect(counts.toolSyntaxLeaks).toBe(1);
    expect(counts.byBucket.tool_syntax_leak).toBe(1);
  });

  it('stores a bounded, single-line detail and survives a reopen', () => {
    service.record({
      bucket: 'provider_http',
      code: 'http',
      detail: `  spaced\n${'x'.repeat(2000)}  `,
    });
    database.onModuleDestroy();

    const reopened = new SessionDatabaseService({
      sessionDbPath: join(dir, 'sessions.sqlite'),
    } as CoreConfig);
    reopened.onModuleInit();
    const again = new TurnErrorsService(reopened);
    expect(again.counts().total).toBe(1);
    const row = reopened.connection
      .prepare('SELECT detail FROM turn_errors')
      .get() as { detail: string };
    expect(row.detail.length).toBeLessThanOrEqual(300);
    expect(row.detail).not.toContain('\n');
    reopened.onModuleDestroy();
  });

  it('prunes rows beyond the retention window', () => {
    service.record({ bucket: 'provider_http', code: 'http' });
    service.prune(new Date(Date.now() + 40 * 24 * 60 * 60 * 1000));
    expect(service.counts().total).toBe(0);
  });
});
