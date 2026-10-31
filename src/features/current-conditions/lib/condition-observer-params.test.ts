import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseConditionObserverParams,
  toConditionObserverParams,
} from './condition-observer-params.ts';

const location = {
  latitudeDegrees: -23.55,
  longitudeDegrees: -46.63,
  elevationMeters: 760,
  accuracyMeters: 12,
  timestamp: 1_700_000_000_000,
};

test('condition observer params round-trip a device location', () => {
  assert.deepEqual(parseConditionObserverParams(toConditionObserverParams(location)), location);
});

test('condition observer params keep a missing accuracy as null', () => {
  const params = toConditionObserverParams({ ...location, accuracyMeters: null });

  assert.equal(params.accuracy, '');
  assert.equal(parseConditionObserverParams(params)?.accuracyMeters, null);
});

test('condition observer params reject missing or invalid coordinates', () => {
  assert.equal(parseConditionObserverParams({}), null);
  assert.equal(parseConditionObserverParams({ latitude: 'abc', longitude: '10' }), null);
  assert.equal(parseConditionObserverParams({ latitude: '91', longitude: '10' }), null);
  assert.equal(parseConditionObserverParams({ latitude: '10', longitude: '181' }), null);
});

test('condition observer params accept repeated route params', () => {
  assert.equal(
    parseConditionObserverParams({ latitude: ['-23.55', '1'], longitude: '-46.63' })
      ?.latitudeDegrees,
    -23.55,
  );
});
