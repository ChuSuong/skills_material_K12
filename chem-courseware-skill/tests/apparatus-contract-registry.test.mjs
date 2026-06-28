import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ApparatusContractRegistry,
  createApparatusFromPreset,
  defaultApparatusContractRegistry,
  defineApparatusPreset,
  getApparatusPreset,
  listApparatusPresets,
} from '../lib/apparatus/registry.js';
import {
  makeContract,
  normalizeContract,
} from '../lib/apparatus/contract.js';
import {
  hasCapabilities,
  normalizeCapabilities,
} from '../lib/apparatus/capabilities.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apparatusCorePath = path.join(repoRoot, 'lib/apparatus/core.js');
const apparatusIndexPath = path.join(repoRoot, 'lib/apparatus/index.js');
const apparatusPresetsPath = path.join(repoRoot, 'lib/apparatus/presets.js');

test('normalizeCapabilities trims and filters entries', () => {
  assert.deepEqual(normalizeCapabilities([' pour ', '', 'heat', null]), ['pour', 'heat']);
});

test('normalizeContract and makeContract preserve contract shape', () => {
  const contract = makeContract({
    kind: 'beaker',
    family: 'open-vessel',
    capabilities: [' pour-target ', 'heat'],
    custom: true,
  });

  assert.equal(contract.kind, 'beaker');
  assert.equal(contract.family, 'open-vessel');
  assert.deepEqual(contract.capabilities, ['pour-target', 'heat']);
  assert.equal(contract.version, 1);
  assert.equal(contract.custom, true);
  assert.deepEqual(normalizeContract(contract), contract);
});

test('registry registers, retrieves, and filters contracts', () => {
  const registry = new ApparatusContractRegistry();
  const beaker = registry.register({ kind: 'beaker', capabilities: ['pour-target', 'heat'] });
  registry.register({ kind: 'dropper', capabilities: ['transfer'] });

  assert.equal(registry.get('beaker'), beaker);
  assert.equal(registry.get('missing'), null);
  assert.deepEqual(registry.findByCapabilities(['pour-target']), [beaker]);
  assert.equal(hasCapabilities(beaker, ['pour-target', 'heat']), true);
  assert.equal(hasCapabilities(beaker, ['transfer']), false);
});

test('preset helpers define, register, query, and instantiate presets', () => {
  const registry = new ApparatusContractRegistry();
  const preset = defineApparatusPreset({
    key: 'demo-beaker',
    kind: 'demo-beaker',
    family: 'open-vessel',
    capabilities: ['liquid-container', 'pour-target'],
    create(options = {}) {
      return { kind: 'demo-beaker', options };
    },
  });

  registry.registerPreset(preset);

  assert.equal(registry.getPreset('demo-beaker')?.key, 'demo-beaker');
  assert.deepEqual(
    registry.listPresets({ capabilities: ['pour-target'] }).map((entry) => entry.key),
    ['demo-beaker']
  );
  assert.deepEqual(registry.createFromPreset('demo-beaker', { sample: true }), {
    kind: 'demo-beaker',
    options: { sample: true },
  });
});

test('default preset helpers expose registered apparatus metadata', () => {
  defaultApparatusContractRegistry.registerPreset({
    key: 'beaker',
    kind: 'beaker',
    family: 'open-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable'],
    create(options = {}) {
      return { kind: 'beaker', options };
    },
  });
  defaultApparatusContractRegistry.registerPreset({
    key: 'erlenmeyer',
    kind: 'erlenmeyer',
    family: 'narrow-neck-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable'],
    create(options = {}) {
      return { kind: 'erlenmeyer', options };
    },
  });
  defaultApparatusContractRegistry.registerPreset({
    key: 'litmus-paper',
    kind: 'litmus-paper',
    family: 'indicator-tool',
    capabilities: ['indicator-contact', 'grip-point'],
    create(options = {}) {
      return { kind: 'litmus-paper', options };
    },
  });

  const beakerPreset = getApparatusPreset('beaker');
  assert.equal(beakerPreset?.family, 'open-vessel');
  assert.equal(beakerPreset?.create != null, true);
  assert.equal(hasCapabilities(beakerPreset?.contract, ['liquid-container', 'pour-target']), true);

  const heated = listApparatusPresets({ capabilities: ['heatable'] }).map((entry) => entry.key);
  assert.ok(heated.includes('beaker'));
  assert.ok(heated.includes('erlenmeyer'));

  const created = createApparatusFromPreset('litmus-paper', { name: 'litmus-check' });
  assert.deepEqual(created, { kind: 'litmus-paper', options: { name: 'litmus-check' } });
});

test('default registry export remains usable and compatibility barrels expose new APIs', async () => {
  assert.ok(defaultApparatusContractRegistry instanceof ApparatusContractRegistry);

  const [coreSource, indexSource, presetsSource] = await Promise.all([
    readFile(apparatusCorePath, 'utf8'),
    readFile(apparatusIndexPath, 'utf8'),
    readFile(apparatusPresetsPath, 'utf8'),
  ]);

  assert.match(coreSource, /export \{ normalizeCapabilities, hasCapabilities \} from '\.\/capabilities\.js';/);
  assert.match(coreSource, /export \{ normalizeContract, makeContract \} from '\.\/contract\.js';/);
  assert.match(coreSource, /export \{[\s\S]*ApparatusContractRegistry,[\s\S]*defaultApparatusContractRegistry[\s\S]*\} from '\.\/registry\.js';/);
  assert.match(indexSource, /export \* from '\.\/capabilities\.js';/);
  assert.match(indexSource, /export \* from '\.\/contract\.js';/);
  assert.match(indexSource, /export \* from '\.\/registry\.js';/);
  assert.match(presetsSource, /registerApparatusPreset/);
  assert.match(presetsSource, /APPARATUS_PRESET_DEFINITIONS/);
  assert.match(presetsSource, /ensureDefaultApparatusPresetsRegistered/);
});
