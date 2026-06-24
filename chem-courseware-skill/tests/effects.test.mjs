import assert from 'node:assert/strict';
import test from 'node:test';

import { popThenFade } from '../skills/chem-courseware-base/effects/particle-pop.mjs';

test('popThenFade fades linearly before the pop threshold', () => {
  const result = popThenFade(0.5, 1);
  assert.equal(result.scale, 0.5);
  assert.equal(result.alpha, 0.5);
});

test('popThenFade swells then drops alpha after the pop threshold', () => {
  const result = popThenFade(0.9, 1, 0.82);
  const popT = (0.9 - 0.82) / (1 - 0.82);
  assert.ok(Math.abs(result.scale - (1 + popT * 0.9)) < 1e-9);
  assert.ok(Math.abs(result.alpha - (1 - popT) * 0.9) < 1e-9);
});

test('popThenFade reaches zero alpha at t=1', () => {
  const result = popThenFade(1, 1);
  assert.ok(Math.abs(result.alpha) < 1e-9);
});
