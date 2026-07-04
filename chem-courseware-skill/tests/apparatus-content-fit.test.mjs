import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONTENT_KINDS,
  allowedContentKindsForFamily,
  getContentKind,
  isCompatibleContent,
} from '../lib/apparatus/capabilities.js';
import {
  assertContentFit,
  makeContract,
  normalizeContract,
} from '../lib/apparatus/contract.js';

function fakeApparatus({ kind, family, contentKind }) {
  return {
    kind,
    family,
    contract: makeContract({ kind, family, contentKind }),
    meta: { contentKind },
  };
}

test('CONTENT_KINDS is the fixed content-kind vocabulary', () => {
  assert.deepEqual([...CONTENT_KINDS], ['liquid', 'solid', 'gas', 'burner', 'tool']);
});

test('allowedContentKindsForFamily maps known families to allow lists', () => {
  assert.deepEqual(allowedContentKindsForFamily('showcase-vessel'), ['liquid']);
  assert.deepEqual(allowedContentKindsForFamily('showcase-solid-jar'), ['solid']);
  assert.deepEqual(allowedContentKindsForFamily('showcase-bottle'), ['liquid']);
  assert.deepEqual(allowedContentKindsForFamily('showcase-heat-source'), ['burner']);
  assert.equal(allowedContentKindsForFamily('unknown-family'), null);
});

test('getContentKind reads declared contentKind then meta then contract', () => {
  assert.equal(getContentKind({ contentKind: 'liquid' }), 'liquid');
  assert.equal(getContentKind({ meta: { contentKind: 'solid' } }), 'solid');
  assert.equal(getContentKind({ contract: { meta: { contentKind: 'gas' } } }), 'gas');
  assert.equal(getContentKind({ contract: { contentKind: 'burner' } }), 'burner');
  assert.equal(getContentKind(null), null);
  assert.equal(getContentKind({}), null);
});

test('normalizeContract preserves contentKind and drops unknown kinds', () => {
  const good = normalizeContract({ kind: 'classic-widemouth-jar', family: 'showcase-solid-jar', contentKind: 'solid' });
  assert.equal(good.contentKind, 'solid');

  const bad = normalizeContract({ kind: 'classic-beaker', family: 'showcase-vessel', contentKind: 'plasma' });
  assert.equal(bad.contentKind, undefined);
});

test('isCompatibleContent accepts declared contentKind matches', () => {
  const jar = fakeApparatus({ kind: 'classic-widemouth-jar', family: 'showcase-solid-jar', contentKind: 'solid' });
  assert.equal(isCompatibleContent(jar, 'solid'), true);
  assert.equal(isCompatibleContent(jar, 'liquid'), false);
});

test('isCompatibleContent falls back to family allow list when no declared kind', () => {
  const beakerNoDeclared = { kind: 'classic-beaker', family: 'showcase-vessel' };
  assert.equal(isCompatibleContent(beakerNoDeclared, 'liquid'), true);
  assert.equal(isCompatibleContent(beakerNoDeclared, 'solid'), false);
});

test('assertContentFit succeeds for valid apparatus/content pairs', () => {
  const jar = fakeApparatus({ kind: 'classic-widemouth-jar', family: 'showcase-solid-jar', contentKind: 'solid' });
  const bottle = fakeApparatus({ kind: 'classic-reagent-bottle', family: 'showcase-bottle', contentKind: 'liquid' });
  const beaker = fakeApparatus({ kind: 'classic-beaker', family: 'showcase-vessel', contentKind: 'liquid' });
  const lamp = fakeApparatus({ kind: 'classic-alcohol-lamp', family: 'showcase-heat-source', contentKind: 'burner' });

  assert.equal(assertContentFit(jar, 'solid'), true);
  assert.equal(assertContentFit(bottle, 'liquid'), true);
  assert.equal(assertContentFit(beaker, 'liquid'), true);
  assert.equal(assertContentFit(lamp, 'burner'), true);
});

test('assertContentFit throws when reagent bottle is asked to hold solid', () => {
  const bottle = fakeApparatus({ kind: 'classic-reagent-bottle', family: 'showcase-bottle', contentKind: 'liquid' });
  assert.throws(
    () => assertContentFit(bottle, 'solid'),
    /classic-reagent-bottle cannot hold contentKind='solid'.*classic-widemouth-jar/s,
  );
});

test('assertContentFit throws when widemouth jar is asked to hold liquid', () => {
  const jar = fakeApparatus({ kind: 'classic-widemouth-jar', family: 'showcase-solid-jar', contentKind: 'solid' });
  assert.throws(
    () => assertContentFit(jar, 'liquid'),
    /classic-widemouth-jar cannot hold contentKind='liquid'/,
  );
});

test('assertContentFit throws for unknown content kinds', () => {
  const beaker = fakeApparatus({ kind: 'classic-beaker', family: 'showcase-vessel', contentKind: 'liquid' });
  assert.throws(
    () => assertContentFit(beaker, 'plasma'),
    /unknown contentKind='plasma'/,
  );
});

test('assertContentFit throws when apparatus is missing', () => {
  assert.throws(
    () => assertContentFit(null, 'liquid'),
    /missing apparatus/,
  );
});
