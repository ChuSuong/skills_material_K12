import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import { popThenFade } from '../skills/chem-courseware-base/effects/particle-pop.mjs';
import { jitterGeometry } from '../skills/chem-courseware-base/effects/jitter-geometry.mjs';

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

test('jitterGeometry displaces vertices and recomputes normals', () => {
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const before = geometry.attributes.position.array.slice();
  const result = jitterGeometry(geometry, 0.05);
  const after = geometry.attributes.position.array;

  assert.equal(result, geometry, 'should mutate and return the same geometry');
  let changed = false;
  for (let i = 0; i < before.length; i++) {
    if (Math.abs(before[i] - after[i]) > 1e-9) {
      changed = true;
      break;
    }
  }
  assert.ok(changed, 'expected at least one vertex to move');
  assert.ok(geometry.attributes.normal, 'expected normals to be recomputed');
});

test('jitterGeometry with amount 0 leaves positions unchanged', () => {
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const before = geometry.attributes.position.array.slice();
  jitterGeometry(geometry, 0);
  const after = geometry.attributes.position.array;
  for (let i = 0; i < before.length; i++) {
    assert.ok(Math.abs(before[i] - after[i]) < 1e-9);
  }
});
