import { LlmError } from '../llm/llm.client';
import { LedgerError } from '../tools/tool-execution.repository';
import {
  classifyError,
  looksLikeToolSyntax,
  toolSyntaxSample,
} from './error-taxonomy';

describe('error taxonomy (R1)', () => {
  it.each([
    ['http', 'provider_http'],
    ['upstream_error', 'upstream_error'],
    ['malformed', 'malformed_completion'],
    ['timeout', 'provider_timeout'],
    ['unreachable', 'provider_timeout'],
    ['aborted', 'provider_timeout'],
  ] as const)('maps LlmError code %s to %s', (code, bucket) => {
    const err = new LlmError(502, 'x', false, undefined, code);
    expect(classifyError(err)).toMatchObject({
      bucket,
      code,
      httpStatus: 502,
    });
  });

  it('classifies ledger errors separately from provider errors', () => {
    expect(classifyError(new LedgerError('boom'))).toMatchObject({
      bucket: 'ledger',
      code: 'ledger_error',
    });
  });

  it('files anything unrecognised as unknown rather than guessing', () => {
    expect(classifyError(new TypeError('weird'))).toMatchObject({
      bucket: 'unknown',
      code: 'TypeError',
    });
    expect(classifyError('not an error')).toMatchObject({
      bucket: 'unknown',
      code: 'non_error_throw',
    });
  });

  describe('tool-syntax leakage (B2)', () => {
    it.each([
      'sure <|dsml|>tool_calls',
      'x <｜tool▁calls▁begin｜> y',
      'x <|tool_calls|> y',
      'x <|function_call|> y',
    ])('detects markup in %s', (text) => {
      expect(looksLikeToolSyntax(text)).toBe(true);
    });

    it.each([
      'a normal reply about tools',
      'the <tool> tag in HTML',
      'x <| not markup |x',
      '',
    ])('does not flag %s', (text) => {
      expect(looksLikeToolSyntax(text)).toBe(false);
    });

    it('returns a bounded single-line sample', () => {
      const sample = toolSyntaxSample(
        `line one\nline two <|dsml|> ${'z'.repeat(500)}`,
      );
      expect(sample.length).toBeLessThanOrEqual(120);
      expect(sample).toContain('<|dsml|>');
      expect(sample).not.toContain('\n');
    });
  });
});
