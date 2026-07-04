import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createElectrodePairApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  rodHeight = 1.05,
  rodRadius = 0.035,
  spacing = 0.34,
  name = 'electrode-pair',
  materials = {},
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const cathodeMaterial = (materials.cathode || new THREE.MeshStandardMaterial({
    color: 0x303844,
    metalness: 0.35,
    roughness: 0.38,
  })).clone();
  const anodeMaterial = (materials.anode || new THREE.MeshStandardMaterial({
    color: 0x1d1f24,
    metalness: 0.25,
    roughness: 0.46,
  })).clone();
  const capMaterial = (materials.cap || new THREE.MeshStandardMaterial({
    color: 0xd7e7f4,
    metalness: 0.08,
    roughness: 0.32,
  })).clone();
  const wireMaterial = (materials.wire || new THREE.MeshStandardMaterial({
    color: 0xffd36a,
    metalness: 0.25,
    roughness: 0.42,
  })).clone();

  const cathode = new THREE.Mesh(
    new THREE.CylinderGeometry(rodRadius, rodRadius, rodHeight, 20),
    cathodeMaterial,
  );
  cathode.position.set(-spacing * 0.5, rodHeight * 0.5, 0);
  group.add(cathode);

  const anode = new THREE.Mesh(
    new THREE.CylinderGeometry(rodRadius, rodRadius, rodHeight, 20),
    anodeMaterial,
  );
  anode.position.set(spacing * 0.5, rodHeight * 0.5, 0);
  group.add(anode);

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(spacing + rodRadius * 3.8, 0.08, 0.12),
    capMaterial,
  );
  bridge.position.set(0, rodHeight + 0.08, 0);
  group.add(bridge);

  const cathodeLead = new THREE.Mesh(
    new THREE.CylinderGeometry(rodRadius * 0.42, rodRadius * 0.42, 0.48, 12),
    wireMaterial,
  );
  cathodeLead.position.set(-spacing * 0.5, rodHeight + 0.28, 0);
  group.add(cathodeLead);

  const anodeLead = new THREE.Mesh(
    new THREE.CylinderGeometry(rodRadius * 0.42, rodRadius * 0.42, 0.48, 12),
    wireMaterial,
  );
  anodeLead.position.set(spacing * 0.5, rodHeight + 0.28, 0);
  group.add(anodeLead);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, rodHeight * 0.72, 0.18, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, rodHeight + 0.1, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, rodHeight * 0.42, 0, `${name}:interactionZone`),
    cathodeTip: makeAnchor(group, -spacing * 0.5, 0.04, 0, `${name}:cathodeTip`),
    anodeTip: makeAnchor(group, spacing * 0.5, 0.04, 0, `${name}:anodeTip`),
    cathodeBubbleOrigin: makeAnchor(group, -spacing * 0.5, rodHeight * 0.28, 0, `${name}:cathodeBubbleOrigin`),
    anodeBubbleOrigin: makeAnchor(group, spacing * 0.5, rodHeight * 0.28, 0, `${name}:anodeBubbleOrigin`),
    cathodeTerminal: makeAnchor(group, -spacing * 0.5, rodHeight + 0.54, 0, `${name}:cathodeTerminal`),
    anodeTerminal: makeAnchor(group, spacing * 0.5, rodHeight + 0.54, 0, `${name}:anodeTerminal`),
  };

  const apparatus = composeApparatus({
    kind: 'electrode-pair',
    family: 'electrolysis-tool',
    group,
    meshes: { cathode, anode, bridge, cathodeLead, anodeLead },
    anchors,
    constraints: {
      electrodeSpacing: spacing,
      immersedHeight: rodHeight * 0.72,
      effectBounds: {
        min: new THREE.Vector3(-spacing, 0, -0.12),
        max: new THREE.Vector3(spacing, rodHeight, 0.12),
      },
    },
    state: { powered: false },
  });

  apparatus.controllers = {
    setPowered(powered = true) {
      apparatus.state.powered = Boolean(powered);
      cathode.material.emissive = new THREE.Color(powered ? 0x173f68 : 0x000000);
      cathode.material.emissiveIntensity = powered ? 0.28 : 0;
      anode.material.emissive = new THREE.Color(powered ? 0x5a2c12 : 0x000000);
      anode.material.emissiveIntensity = powered ? 0.18 : 0;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.92, 0.36),
    role: 'electrode-label',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#8ce3ff' });

  return apparatus;
}
