import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { clamp, makeAnchor, validateFillLevel } from '../core.js';
import { clearWater } from '../chemicals.js';

export { THREE, clamp, makeAnchor, validateFillLevel };

export function cloneMaterial(material, fallback) {
  return (material || fallback).clone();
}

export function applyTransform(group, position = [0, 0, 0], rotation = [0, 0, 0]) {
  group.position.set(position[0], position[1], position[2]);
  group.rotation.set(rotation[0], rotation[1], rotation[2]);
}

export function addToParent(parent, child) {
  if (parent) {
    parent.add(child);
  }
}

export function createDefaultGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8f7ff,
    transparent: true,
    opacity: 0.28,
    transmission: 0.92,
    roughness: 0.08,
    thickness: 0.12,
  });
}

export function buildLiquidMaterials(materials, appearance = clearWater()) {
  return {
    liquidMaterial: cloneMaterial(materials.liquid, appearance.createLiquidMaterial()),
    surfaceMaterial: cloneMaterial(materials.surface, appearance.createSurfaceMaterial()),
  };
}

export function attachCommonContainerAnchors({ group, name, labelY, mouthY, pourTargetY, effectY, gripY = null, extra = {} }) {
  return {
    labelAnchor: makeAnchor(group, 0, labelY, 0, `${name}:labelAnchor`),
    mouth: makeAnchor(group, 0, mouthY, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, pourTargetY, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, effectY, 0, `${name}:effectOrigin`),
    ...(gripY == null ? {} : { gripAnchor: makeAnchor(group, 0, gripY, 0, `${name}:gripAnchor`) }),
    ...extra,
  };
}

export function attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController) {
  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setLiquidLevel(nextFillRatio, options) {
      return liquidController.setLiquidLevel(nextFillRatio, options);
    },
    setLiquidOpacity(alpha) {
      const value = clamp(alpha, 0, 1);
      liquid.material.opacity = value;
      if (liquidSurface) {
        liquidSurface.material.opacity = clamp(value + 0.08, 0, 1);
      }
    },
  };
  apparatus.validators = [
    ...(apparatus.validators || []),
    () => validateFillLevel(apparatus, apparatus.state.fillHeight),
  ];
}
