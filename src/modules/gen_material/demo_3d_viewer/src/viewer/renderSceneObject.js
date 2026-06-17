import { objectRegistry } from './objectRegistry';

export function renderSceneObject(obj, onClick, registry = objectRegistry) {
  if (obj.model_url) {
    return registry.__generatedModel.render(obj, onClick, registry.__generatedModel.component);
  }

  const entry = registry[obj.type];
  if (entry) {
    return entry.render(obj, onClick, entry.component);
  }

  return registry.__generatedPlaceholder.render(obj, onClick, registry.__generatedPlaceholder.component);
}
