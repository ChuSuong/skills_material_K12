import {
  CONTENT_KINDS,
  isCompatibleContent,
  normalizeCapabilities,
} from './capabilities.js';

function normalizeInteractionAnchors(interactionAnchors = []) {
  if (!Array.isArray(interactionAnchors)) {
    return [];
  }
  return interactionAnchors.filter((anchor) => typeof anchor === 'string' && anchor.trim()).map((anchor) => anchor.trim());
}

function normalizeContentKind(contentKind) {
  if (typeof contentKind !== 'string') return undefined;
  const trimmed = contentKind.trim();
  if (!trimmed) return undefined;
  return CONTENT_KINDS.includes(trimmed) ? trimmed : undefined;
}

export function normalizeContract(contract = {}) {
  const kind = typeof contract.kind === 'string' && contract.kind.trim() ? contract.kind.trim() : null;
  const family = typeof contract.family === 'string' ? contract.family : undefined;
  const capabilities = normalizeCapabilities(contract.capabilities);
  const interactionAnchors = normalizeInteractionAnchors(contract.interactionAnchors);
  const interactionMode = typeof contract.interactionMode === 'string' && contract.interactionMode.trim()
    ? contract.interactionMode.trim()
    : undefined;
  const contentKind = normalizeContentKind(contract.contentKind);
  const version = contract.version ?? 1;

  return {
    ...contract,
    kind,
    family,
    capabilities,
    interactionAnchors,
    interactionMode,
    contentKind,
    version,
  };
}

export function makeContract({ kind, family, capabilities = [], contentKind, version = 1, ...rest } = {}) {
  return normalizeContract({ kind, family, capabilities, contentKind, version, ...rest });
}

export function assertContentFit(apparatus, contentKind) {
  if (!apparatus) {
    throw new Error(`assertContentFit: missing apparatus for contentKind='${contentKind}'`);
  }
  if (!CONTENT_KINDS.includes(contentKind)) {
    throw new Error(`assertContentFit: unknown contentKind='${contentKind}'. Allowed: ${CONTENT_KINDS.join(', ')}`);
  }
  if (!isCompatibleContent(apparatus, contentKind)) {
    const kind = apparatus.kind ?? apparatus.contract?.kind ?? 'apparatus';
    throw new Error(
      `assertContentFit: ${kind} cannot hold contentKind='${contentKind}'. `
      + 'Use a container whose family matches this content (e.g. classic-widemouth-jar for solids, classic-reagent-bottle for liquids).',
    );
  }
  return true;
}
