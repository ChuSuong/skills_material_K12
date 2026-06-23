import { hasCapabilities, normalizeCapabilities } from './capabilities.js';
import { normalizeContract } from './contract.js';

export function defineApparatusPreset(definition = {}) {
  const contract = normalizeContract(definition.contract ?? definition);
  if (!contract.kind) {
    throw new Error('Preset definition must include a non-empty kind');
  }

  return {
    key: definition.key ?? contract.kind,
    title: definition.title ?? contract.kind,
    description: definition.description,
    family: contract.family,
    capabilities: normalizeCapabilities(definition.capabilities ?? contract.capabilities),
    contract: {
      ...contract,
      capabilities: normalizeCapabilities(definition.capabilities ?? contract.capabilities),
    },
    create: typeof definition.create === 'function' ? definition.create : null,
    meta: definition.meta ?? {},
  };
}

export class ApparatusContractRegistry {
  constructor() {
    this._byKind = new Map();
    this._presetDefinitions = new Map();
  }

  register(contract) {
    const normalized = normalizeContract(contract);
    if (!normalized.kind) {
      throw new Error('Contract must include a non-empty kind');
    }
    this._byKind.set(normalized.kind, normalized);
    return normalized;
  }

  registerPreset(definition) {
    const normalized = defineApparatusPreset(definition);
    this.register(normalized.contract);
    this._presetDefinitions.set(normalized.key, normalized);
    return normalized;
  }

  get(kind) {
    return this._byKind.get(kind) ?? null;
  }

  getPreset(key) {
    return this._presetDefinitions.get(key) ?? null;
  }

  list() {
    return Array.from(this._byKind.values());
  }

  listPresets(filters = {}) {
    const family = filters.family ?? null;
    const requiredCapabilities = normalizeCapabilities(filters.capabilities ?? []);
    return Array.from(this._presetDefinitions.values()).filter((preset) => {
      if (family && preset.family !== family) {
        return false;
      }
      if (requiredCapabilities.length > 0 && !hasCapabilities(preset.contract, requiredCapabilities)) {
        return false;
      }
      return true;
    });
  }

  createFromPreset(key, options = {}) {
    const preset = this.getPreset(key);
    if (!preset) {
      throw new Error(`Unknown apparatus preset: ${key}`);
    }
    if (typeof preset.create !== 'function') {
      throw new Error(`Preset does not provide a factory: ${key}`);
    }
    return preset.create(options);
  }

  findByCapabilities(required = []) {
    const req = Array.isArray(required) ? required : [];
    return this.list().filter((c) => hasCapabilities(c, req));
  }
}

export const defaultApparatusContractRegistry = new ApparatusContractRegistry();

export function registerApparatusPreset(definition) {
  return defaultApparatusContractRegistry.registerPreset(definition);
}

export function getApparatusPreset(key) {
  return defaultApparatusContractRegistry.getPreset(key);
}

export function listApparatusPresets(filters = {}) {
  return defaultApparatusContractRegistry.listPresets(filters);
}

export function createApparatusFromPreset(key, options = {}) {
  return defaultApparatusContractRegistry.createFromPreset(key, options);
}
