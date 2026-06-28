import { normalizeCapabilities } from './capabilities.js';

function normalizeInteractionAnchors(interactionAnchors = []) {
  if (!Array.isArray(interactionAnchors)) {
    return [];
  }
  return interactionAnchors.filter((anchor) => typeof anchor === 'string' && anchor.trim()).map((anchor) => anchor.trim());
}

export function normalizeContract(contract = {}) {
  const kind = typeof contract.kind === 'string' && contract.kind.trim() ? contract.kind.trim() : null;
  const family = typeof contract.family === 'string' ? contract.family : undefined;
  const capabilities = normalizeCapabilities(contract.capabilities);
  const interactionAnchors = normalizeInteractionAnchors(contract.interactionAnchors);
  const interactionMode = typeof contract.interactionMode === 'string' && contract.interactionMode.trim()
    ? contract.interactionMode.trim()
    : undefined;
  const version = contract.version ?? 1;

  return {
    ...contract,
    kind,
    family,
    capabilities,
    interactionAnchors,
    interactionMode,
    version,
  };
}

export function makeContract({ kind, family, capabilities = [], version = 1, ...rest } = {}) {
  return normalizeContract({ kind, family, capabilities, version, ...rest });
}
