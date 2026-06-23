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
