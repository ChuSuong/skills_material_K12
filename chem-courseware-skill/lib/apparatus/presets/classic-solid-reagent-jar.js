// deprecated: use classic-widemouth-jar
import { createClassicWideMouthJarApparatus } from './classic-widemouth-jar.js';

export function createClassicSolidReagentJarApparatus(options = {}) {
  const apparatus = createClassicWideMouthJarApparatus(options);
  const controllers = apparatus.controllers ?? {};
  if (typeof controllers.setFillAmount === 'function' && typeof controllers.setLoadedAmount !== 'function') {
    controllers.setLoadedAmount = controllers.setFillAmount;
  }
  apparatus.controllers = controllers;
  return apparatus;
}
