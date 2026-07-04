export function normalizeCapabilities(capabilities = []) {
  if (!Array.isArray(capabilities)) {
    return [];
  }
  return capabilities.filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim());
}

export function hasCapabilities(contract, required = []) {
  const contractCaps = normalizeCapabilities(contract?.capabilities);
  const req = normalizeCapabilities(required);
  return req.every((cap) => contractCaps.includes(cap));
}

export const CONTENT_KINDS = Object.freeze(['liquid', 'solid', 'gas', 'burner', 'tool']);

const FAMILY_CONTENT_ALLOW_LIST = Object.freeze({
  'showcase-vessel': ['liquid'],
  'showcase-solid-jar': ['solid'],
  'showcase-bottle': ['liquid'],
  'showcase-heat-source': ['burner'],
  'showcase-tool': ['tool'],
  'showcase-metal-sample': ['solid'],
  'showcase-support': ['tool'],
  'showcase-moist-paper': ['tool', 'solid'],
});

export function getContentKind(apparatusOrContract) {
  if (!apparatusOrContract) return null;
  const direct = apparatusOrContract.contentKind;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const fromMeta = apparatusOrContract.meta?.contentKind;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  const fromContract = apparatusOrContract.contract?.meta?.contentKind
    ?? apparatusOrContract.contract?.contentKind;
  if (typeof fromContract === 'string' && fromContract.trim()) return fromContract.trim();
  return null;
}

export function allowedContentKindsForFamily(family) {
  if (!family) return null;
  return FAMILY_CONTENT_ALLOW_LIST[family] ?? null;
}

export function isCompatibleContent(apparatusOrContract, contentKind) {
  if (!contentKind || !CONTENT_KINDS.includes(contentKind)) return false;
  const family = apparatusOrContract?.family ?? apparatusOrContract?.contract?.family;
  const declared = getContentKind(apparatusOrContract);
  if (declared && declared === contentKind) return true;
  const allowed = allowedContentKindsForFamily(family);
  if (allowed && allowed.includes(contentKind)) return true;
  return false;
}
