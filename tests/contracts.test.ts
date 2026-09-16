import { describe, expect, it } from 'vitest';
import { blockExtraSchemas, blockTypeSchema, CONTRACT_VERSION, normalizeBlockExtra, parseBlockContract } from '../server/contracts.js';

describe('shared creator-content contracts', () => {
  it('accepts the editor envelope for every supported block type', () => {
    const types = blockTypeSchema.options;
    expect(types).toHaveLength(Object.keys(blockExtraSchemas).length);

    for (const type of types) {
      const parsed = parseBlockContract({ type, title: `Test ${type}`, extra: {} });
      expect(parsed.success, type).toBe(true);
      if (parsed.success) expect((parsed.data as { contractVersion: number }).contractVersion).toBe(CONTRACT_VERSION);
    }
  });

  it('rejects identity and ownership fields in block data', () => {
    expect(parseBlockContract({ type: 'link', title: 'Unsafe', extra: { id: 'attacker' } }).success).toBe(false);
    expect(parseBlockContract({ type: 'link', title: 'Unsafe', profileId: 'victim' }).success).toBe(false);
    expect(parseBlockContract({ type: 'link', title: 'Unsafe', extra: { page_id: 'victim' } }).success).toBe(false);
  });

  it('validates URLs by block purpose and preserves compatible legacy fields', () => {
    expect(parseBlockContract({ type: 'link', title: 'Link', url: 'javascript:alert(1)' }).success).toBe(false);
    expect(parseBlockContract({ type: 'booking', title: 'Booking', url: 'https://example.com/meeting' }).success).toBe(false);
    expect(normalizeBlockExtra('link', { label: 'Legacy label', customFlag: true })).toEqual({ label: 'Legacy label', customFlag: true });
  });

  it('redacts protected content at the public deserialization boundary', () => {
    expect(normalizeBlockExtra('content_gate', { body: '<p>secret</p>', password: 'secret', locked: false })).toEqual({ locked: true });
  });
});
