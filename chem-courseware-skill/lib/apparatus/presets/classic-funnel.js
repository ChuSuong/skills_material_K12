import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  makeAnchor,
} from './shared.js';
import {
  createClassicGlassMaterial,
  createClassicGlassRimMaterial,
  latheFromProfile,
} from './classic-showcase.js';

function funnelProfile(topRadius, stemRadius, coneHeight, stemLength) {
  const coneSegments = 6;
  const pts = [];
  for (let i = 0; i <= coneSegments; i += 1) {
    const t = i / coneSegments;
    const eased = t * t;
    const x = stemRadius + (topRadius - stemRadius) * eased;
    const y = stemLength + coneHeight * t;
    pts.push([x, y]);
  }
  pts.unshift([stemRadius, 0]);
  pts.unshift([stemRadius * 1.05, -0.001]);
  pts.splice(1, 0, [stemRadius, stemLength]);
  pts.push([topRadius * 1.04, stemLength + coneHeight]);
  return pts;
}

export function createClassicFunnelApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  topRadius = 0.9,
  stemRadius = 0.12,
  coneHeight = 0.9,
  stemLength = 1.0,
  materials = {},
  name = 'classic-funnel',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);

  const totalHeight = stemLength + coneHeight;

  const body = new THREE.Mesh(
    latheFromProfile(funnelProfile(topRadius, stemRadius, coneHeight, stemLength), 72),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius * 1.04, topRadius * 0.02, 12, 40),
    rimMaterial,
  );
  rim.position.y = totalHeight;
  rim.rotation.x = Math.PI * 0.5;
  group.add(rim);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, totalHeight * 0.6, topRadius + 0.14, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, stemLength + coneHeight * 0.3, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, totalHeight - 0.05, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, totalHeight, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, totalHeight - 0.05, 0, `${name}:pourTarget`),
    stemTip: makeAnchor(group, 0, 0, 0, `${name}:stemTip`),
    effectOrigin: makeAnchor(group, 0, stemLength, 0, `${name}:effectOrigin`),
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'classic-funnel',
    family: 'showcase-tool',
    meshes: { body, rim },
    anchors,
    constraints: {
      innerRadius: topRadius * 0.9,
      innerHeight: coneHeight,
      stemRadius,
      stemLength,
    },
    state: {},
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'tool',
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.0, 0.38),
    role: 'vessel-body-label',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
