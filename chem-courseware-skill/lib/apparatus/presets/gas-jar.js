import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createGasJarApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.34,
  height = 1.55,
  gasColor = 0xdff7ff,
  gasOpacity = 0.04,
  materials = {},
  name = 'gas-jar',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  glassMaterial.opacity = 0.2;
  glassMaterial.transmission = 0.94;
  glassMaterial.depthWrite = false;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1, true),
    glassMaterial,
  );
  body.position.y = height * 0.5;
  group.add(body);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.035, 32),
    cloneMaterial(materials.base, glassMaterial),
  );
  base.material.opacity = 0.3;
  base.material.transmission = 0.88;
  base.position.y = 0.0175;
  group.add(base);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.022, 12, 32),
    cloneMaterial(materials.rim, glassMaterial),
  );
  rim.material.opacity = 0.48;
  rim.material.transmission = 0.72;
  rim.position.y = height;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const gasFill = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, height * 0.86, 28),
    new THREE.MeshBasicMaterial({
      color: gasColor,
      transparent: true,
      opacity: gasOpacity,
      depthWrite: false,
    }),
  );
  gasFill.position.y = height * 0.48;
  group.add(gasFill);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.58, radius + 0.06, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.55, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height - 0.08, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    gasInlet: makeAnchor(group, 0, height - 0.08, 0, `${name}:gasInlet`),
    gasVolume: makeAnchor(group, 0, height * 0.52, 0, `${name}:gasVolume`),
    effectOrigin: makeAnchor(group, 0, height * 0.52, 0, `${name}:effectOrigin`),
  };

  const apparatus = composeApparatus({
    kind: 'gas-jar',
    family: 'gas-collection-vessel',
    group,
    meshes: { body, base, rim, gasFill },
    anchors,
    constraints: {
      innerRadius: radius * 0.88,
      innerHeight: height * 0.86,
      safePourRadius: radius * 0.7,
      safePourClearance: 0.08,
      effectBounds: {
        min: new THREE.Vector3(-radius * 0.88, 0.08, -radius * 0.88),
        max: new THREE.Vector3(radius * 0.88, height, radius * 0.88),
      },
    },
    state: { gasOpacity },
  });

  apparatus.controllers = {
    setGasOpacity(alpha) {
      const value = Math.max(0, Math.min(1, alpha));
      gasFill.material.opacity = value;
      apparatus.state.gasOpacity = value;
      return value;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(radius * 1.8, 0.38),
    role: 'vessel-body-label',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  apparatus.validators = [];
  return apparatus;
}
