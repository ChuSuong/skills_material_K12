import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';

import { popThenFade } from '../skills/chem-courseware-base/effects/particle-pop.mjs';
import { jitterGeometry } from '../skills/chem-courseware-base/effects/jitter-geometry.mjs';
import { drawCloudBlobs, drawBubbleGlow, DEFAULT_CLOUD_BLOBS } from '../skills/chem-courseware-base/effects/organic-texture.mjs';
import { createFlowMaterial } from '../skills/chem-courseware-base/effects/liquid-shader.mjs';

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

function createMockContext() {
  const calls = { createRadialGradient: 0, fillRect: 0, fill: 0, beginPath: 0, arc: 0 };
  const gradient = { addColorStop: () => {} };
  return {
    calls,
    fillStyle: null,
    createRadialGradient: () => {
      calls.createRadialGradient++;
      return gradient;
    },
    fillRect: () => { calls.fillRect++; },
    fill: () => { calls.fill++; },
    beginPath: () => { calls.beginPath++; },
    arc: () => { calls.arc++; }
  };
}

test('drawCloudBlobs draws one radial gradient per blob', () => {
  const ctx = createMockContext();
  drawCloudBlobs(ctx, 128);
  assert.equal(ctx.calls.createRadialGradient, DEFAULT_CLOUD_BLOBS.length);
  assert.equal(ctx.calls.fillRect, DEFAULT_CLOUD_BLOBS.length);
});

test('drawCloudBlobs accepts a custom blob list', () => {
  const ctx = createMockContext();
  drawCloudBlobs(ctx, 128, [{ x: 0.5, y: 0.5, r: 0.4, a: 0.5 }]);
  assert.equal(ctx.calls.createRadialGradient, 1);
  assert.equal(ctx.calls.fillRect, 1);
});

test('drawBubbleGlow draws a single radial gradient filled as a circle', () => {
  const ctx = createMockContext();
  drawBubbleGlow(ctx, 128);
  assert.equal(ctx.calls.createRadialGradient, 1);
  assert.equal(ctx.calls.beginPath, 1);
  assert.equal(ctx.calls.arc, 1);
  assert.equal(ctx.calls.fill, 1);
});

test('createFlowMaterial returns a ShaderMaterial with default uniforms', () => {
  const material = createFlowMaterial();
  assert.ok(material instanceof THREE.ShaderMaterial);
  assert.equal(material.uniforms.uOpacity.value, 0.7);
  assert.equal(material.uniforms.uColor.value.getHexString(), 'bcecff');
  assert.equal(material.uniforms.uGlow.value.getHexString(), '67d8ff');
  assert.match(material.vertexShader, /uTime/);
  assert.match(material.fragmentShader, /fresnel/);
});

test('createFlowMaterial accepts custom color and glow', () => {
  const material = createFlowMaterial({ color: 0xff0000, glow: 0x00ff00 });
  assert.equal(material.uniforms.uColor.value.getHexString(), 'ff0000');
  assert.equal(material.uniforms.uGlow.value.getHexString(), '00ff00');
});
