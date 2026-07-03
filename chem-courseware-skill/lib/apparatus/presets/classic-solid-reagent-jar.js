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
  createClassicShadowMaterial,
} from './classic-showcase.js';

export function createClassicSolidReagentJarApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.62,
  height = 1.74,
  materials = {},
  name = 'classic-solid-reagent-jar',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const zincMaterial = cloneMaterial(
    materials.zinc,
    new THREE.MeshStandardMaterial({
      color: 0xc5ced5,
      roughness: 0.54,
      metalness: 0.72,
    }),
  );

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.96, height, 40),
    glassMaterial,
  );
  body.position.y = height * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius * 0.94, 0.12, 40),
    cloneMaterial(materials.base, rimMaterial),
  );
  bottom.position.y = 0.06;
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  group.add(bottom);

  const mouthRim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.01, 0.06, 14, 40),
    rimMaterial,
  );
  mouthRim.position.y = height + 0.02;
  mouthRim.rotation.x = Math.PI * 0.5;
  mouthRim.castShadow = true;
  mouthRim.receiveShadow = true;
  group.add(mouthRim);

  const granules = [];
  const baseGranuleScales = [];
  for (let index = 0; index < 10; index += 1) {
    const granule = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.11 + (index % 3) * 0.018, 0),
      zincMaterial,
    );
    granule.position.set(
      ((index % 4) - 1.5) * 0.18,
      0.2 + Math.floor(index / 4) * 0.16 + (index % 2) * 0.03,
      (Math.floor(index / 2) % 2 === 0 ? 1 : -1) * 0.11,
    );
    granule.rotation.set(index * 0.2, index * 0.34, index * 0.15);
    granule.castShadow = true;
    granule.receiveShadow = true;
    group.add(granule);
    granules.push(granule);
    baseGranuleScales.push(granule.scale.clone());
  }

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.2, radius * 2.1),
    createClassicShadowMaterial(materials),
  );
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = 0.01;
  group.add(shadow);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.72, radius + 0.2, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.88, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height * 0.86, 0, `${name}:interactionZone`),
    dropAnchor: makeAnchor(group, 0, height + 0.14, 0, `${name}:dropAnchor`),
  };

  const apparatus = composeApparatus({
    kind: 'classic-solid-reagent-jar',
    family: 'showcase-solid-jar',
    group,
    meshes: { body, bottom, mouthRim, granules, shadow },
    anchors,
    constraints: {
      effectBounds: {
        min: new THREE.Vector3(-radius, 0, -radius),
        max: new THREE.Vector3(radius, height + 0.2, radius),
      },
    },
    state: {
      loadedAmount: 1,
    },
    meta: { visualFamily: 'classic-showcase' },
  });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setLoadedAmount(amount = 1) {
      const value = Math.max(0, Math.min(1, amount));
      apparatus.state.loadedAmount = value;
      for (const [index, granule] of granules.entries()) {
        const visibility = index / Math.max(1, granules.length - 1) <= value + 0.04;
        granule.visible = visibility;
        granule.scale.copy(baseGranuleScales[index]).multiplyScalar(visibility ? 1 : 0.0001);
      }
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.18, 0.42),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#d7edf8' });
  apparatus.controllers.setLoadedAmount(1);
  return apparatus;
}
