import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyDeclination, declinationFromHeading } from './magnetic-declination.ts';

describe('declinationFromHeading', () => {
  it('returns the signed difference between true and magnetic heading', () => {
    assert.equal(declinationFromHeading({ magHeading: 100, trueHeading: 78 }), -22);
    assert.equal(declinationFromHeading({ magHeading: 100, trueHeading: 112 }), 12);
  });

  it('handles the wrap-around at north', () => {
    assert.equal(declinationFromHeading({ magHeading: 10, trueHeading: 350 }), -20);
    assert.equal(declinationFromHeading({ magHeading: 350, trueHeading: 10 }), 20);
  });

  it('rejects readings without true north or with implausible values', () => {
    assert.equal(declinationFromHeading({ magHeading: 100, trueHeading: -1 }), null);
    assert.equal(declinationFromHeading({ magHeading: Number.NaN, trueHeading: 10 }), null);
    assert.equal(declinationFromHeading({ magHeading: 0, trueHeading: 120 }), null);
  });
});

describe('applyDeclination', () => {
  it('converts a magnetic heading to a true heading in the 0-360 range', () => {
    assert.equal(applyDeclination(100, -22), 78);
    assert.equal(applyDeclination(10, -22), 348);
    assert.equal(applyDeclination(350, 20), 10);
  });
});
