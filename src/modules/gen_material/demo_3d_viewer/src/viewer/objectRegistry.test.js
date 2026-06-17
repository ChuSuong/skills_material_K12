import { builtInObjectTypes, objectRegistry } from './objectRegistry';

describe('objectRegistry', () => {
  test('contains generated and built-in entries', () => {
    expect(objectRegistry.__generatedModel).toBeDefined();
    expect(objectRegistry.__generatedPlaceholder).toBeDefined();
    expect(objectRegistry.torusKnot).toBeDefined();
    expect(objectRegistry.planet).toBeDefined();
  });

  test('exposes built-in object type list without internal entries', () => {
    expect(builtInObjectTypes).toContain('torusKnot');
    expect(builtInObjectTypes).toContain('planet');
    expect(builtInObjectTypes).not.toContain('__generatedModel');
  });
});
