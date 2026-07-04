import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createDcPowerSupplyApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.82,
  height = 0.46,
  depth = 0.46,
  name = 'dc-power-supply',
  materials = {},
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const bodyMaterial = (materials.body || new THREE.MeshStandardMaterial({
    color: 0x273244,
    metalness: 0.08,
    roughness: 0.45,
  })).clone();
  const panelMaterial = (materials.panel || new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.05,
    roughness: 0.38,
  })).clone();
  const positiveMaterial = (materials.positive || new THREE.MeshStandardMaterial({
    color: 0xff5d57,
    metalness: 0.18,
    roughness: 0.28,
    emissive: 0x3a0808,
    emissiveIntensity: 0.12,
  })).clone();
  const negativeMaterial = (materials.negative || new THREE.MeshStandardMaterial({
    color: 0x5ca8ff,
    metalness: 0.18,
    roughness: 0.28,
    emissive: 0x061f42,
    emissiveIntensity: 0.12,
  })).clone();
  const displayMaterial = (materials.display || new THREE.MeshBasicMaterial({
    color: 0x7df5ff,
    transparent: true,
    opacity: 0.68,
  })).clone();

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMaterial);
  body.position.y = height * 0.5;
  group.add(body);

  const frontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.82, height * 0.68, 0.025),
    panelMaterial,
  );
  frontPanel.position.set(0, height * 0.55, depth * 0.5 + 0.014);
  group.add(frontPanel);

  const display = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.32, height * 0.18, 0.03),
    displayMaterial,
  );
  display.position.set(0, height * 0.68, depth * 0.5 + 0.032);
  group.add(display);

  const positiveTerminal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20),
    positiveMaterial,
  );
  positiveTerminal.rotation.x = Math.PI / 2;
  positiveTerminal.position.set(width * 0.25, height * 0.34, depth * 0.5 + 0.04);
  group.add(positiveTerminal);

  const negativeTerminal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20),
    negativeMaterial,
  );
  negativeTerminal.rotation.x = Math.PI / 2;
  negativeTerminal.position.set(-width * 0.25, height * 0.34, depth * 0.5 + 0.04);
  group.add(negativeTerminal);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.82, depth * 0.5 + 0.14, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.58, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height * 0.46, depth * 0.5 + 0.08, `${name}:interactionZone`),
    positiveTerminal: makeAnchor(group, width * 0.25, height * 0.34, depth * 0.5 + 0.08, `${name}:positiveTerminal`),
    negativeTerminal: makeAnchor(group, -width * 0.25, height * 0.34, depth * 0.5 + 0.08, `${name}:negativeTerminal`),
    wireExit: makeAnchor(group, 0, height * 0.22, depth * 0.5 + 0.08, `${name}:wireExit`),
  };

  const apparatus = composeApparatus({
    kind: 'dc-power-supply',
    family: 'power-source',
    group,
    meshes: { body, frontPanel, display, positiveTerminal, negativeTerminal },
    anchors,
    constraints: {
      voltageRange: [0, 12],
      effectBounds: {
        min: new THREE.Vector3(-width * 0.55, 0, -depth * 0.55),
        max: new THREE.Vector3(width * 0.55, height, depth * 0.6),
      },
    },
    state: { powered: false, voltage: 6 },
  });

  apparatus.controllers = {
    setPowered(powered = true) {
      apparatus.state.powered = Boolean(powered);
      display.material.opacity = powered ? 0.95 : 0.36;
    },
    setVoltage(voltage = 6) {
      const value = Math.max(0, Math.min(12, voltage));
      apparatus.state.voltage = value;
      return value;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(width * 1.04, height * 0.64),
    role: 'power-supply-label',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#8ce3ff' });

  return apparatus;
}
