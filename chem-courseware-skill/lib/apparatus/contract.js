import { normalizeCapabilities } from './capabilities.js';

export function normalizeContract(contract = {}) {
  const kind = typeof contract.kind === 'string' && contract.kind.trim() ? contract.kind.trim() : null;
  const family = typeof contract.family === 'string' ? contract.family : undefined;
  const capabilities = normalizeCapabilities(contract.capabilities);
  const version = contract.version ?? 1;

  return {
    ...contract,
    kind,
    family,
    capabilities,
    version,
  };
}

export function makeContract({ kind, family, capabilities = [], version = 1, ...rest } = {}) {
  return normalizeContract({ kind, family, capabilities, version, ...rest });
}
