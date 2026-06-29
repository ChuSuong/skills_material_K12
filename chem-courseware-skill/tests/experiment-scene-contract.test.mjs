import assert from 'node:assert/strict';
import test from 'node:test';

import { auditExperimentSceneContract } from '../scripts/audit-experiment-scene-contract.mjs';

const baseDraft = {
  kind: 'experiment',
  renderMode: 'threejs',
  scene: {
    apparatus: ['beaker', 'iron-nail'],
  },
};

const registeredPresetKeys = ['beaker', 'iron-nail'];

test('experiment scene contract accepts library apparatus, anchors, labels, and verifier hooks', async () => {
  const sceneSource = `
    const beaker = createBeakerApparatus({ parent: labStage, name: 'cuso4-beaker' });
    const nail = createIronNailApparatus({ parent: labStage, name: 'iron-nail' });
    const target = beaker.anchors.interactionZone;
    const sample = nail.anchors.tipAnchor;
    beaker.controllers.setLabel({ title: 'CuSO4', subtitle: 'Dung dịch xanh' });
    nail.controllers.setLabel({ title: 'Fe', subtitle: 'Đinh sắt' });
    installCoursewareTestHarness({
      getVerifierMeta() {},
      getGoldenPath() {},
      runVerifierStep() {},
    });
  `;

  const result = await auditExperimentSceneContract({ draft: baseDraft, sceneSource, registeredPresetKeys });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('experiment scene contract rejects unregistered apparatus and scene-local geometry fallback', async () => {
  const sceneSource = `
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2), material);
    const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4), material);
    installCoursewareTestHarness({
      getVerifierMeta() {},
      getGoldenPath() {},
      runVerifierStep() {},
    });
  `;
  const draft = {
    ...baseDraft,
    scene: { apparatus: ['beaker', 'iron-nail', 'copper-strip'] },
  };

  const result = await auditExperimentSceneContract({ draft, sceneSource, registeredPresetKeys });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /not registered: copper-strip/.test(error)));
  assert.ok(result.errors.some((error) => /library preset: beaker/.test(error)));
  assert.ok(result.errors.some((error) => /library preset: iron-nail/.test(error)));
  assert.ok(result.errors.some((error) => /apparatus anchors/.test(error)));
  assert.ok(result.errors.some((error) => /apparatus labels/.test(error)));
});

test('experiment scene contract rejects missing verifier hooks', async () => {
  const sceneSource = `
    const beaker = createApparatusFromPreset('beaker', { parent: labStage });
    const nail = createApparatusFromPreset('iron-nail', { parent: labStage });
    const target = beaker.anchors.effectOrigin;
    nail.controllers.setLabel({ title: 'Fe' });
  `;

  const result = await auditExperimentSceneContract({ draft: baseDraft, sceneSource, registeredPresetKeys });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /getVerifierMeta/.test(error)));
  assert.ok(result.errors.some((error) => /getGoldenPath/.test(error)));
  assert.ok(result.errors.some((error) => /runVerifierStep/.test(error)));
});
