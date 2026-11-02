import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseSkyAlertPreferences } from './sky-alert-preferences.ts';

describe('parseSkyAlertPreferences', () => {
  it('reads stored preferences', () => {
    assert.deepEqual(parseSkyAlertPreferences('{"enabled":true,"leadMinutes":60}'), {
      enabled: true,
      leadMinutes: 60,
    });
  });

  it('falls back to the default lead for unsupported values', () => {
    assert.deepEqual(parseSkyAlertPreferences('{"enabled":false,"leadMinutes":7}'), {
      enabled: false,
      leadMinutes: 30,
    });
  });

  it('returns null for missing or corrupted data', () => {
    assert.equal(parseSkyAlertPreferences(null), null);
    assert.equal(parseSkyAlertPreferences('not json'), null);
    assert.equal(parseSkyAlertPreferences('{"leadMinutes":15}'), null);
  });
});
