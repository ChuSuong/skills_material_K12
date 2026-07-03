import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function resolveWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

function worldToParentLocal(parent, point, out = new THREE.Vector3()) {
  out.copy(point);
  if (typeof parent?.worldToLocal === 'function') {
    parent.worldToLocal(out);
  }
  return out;
}

function placeSegment(mesh, from, to, radiusScale = 1) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  if (length <= 0.0001) {
    mesh.visible = false;
    return false;
  }

  const midpoint = new THREE.Vector3().copy(from).lerp(to, 0.5);
  mesh.position.copy(midpoint);
  mesh.scale.set(radiusScale, length, radiusScale);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.visible = true;
  return true;
}

export function createPourStream({
  parent,
  color = 0xbcecff,
  radius = 0.055,
  opacity = 0.72,
  emissive = 0x67d8ff,
  name = 'pour-stream',
  segmentCount = 6,
} = {}) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    emissive,
    emissiveIntensity: 0.18,
    roughness: 0.18,
    transmission: 0.16,
    depthWrite: false,
  });

  const mesh = new THREE.Group();
  mesh.name = name;
  mesh.visible = false;
  mesh.material = material;
  parent?.add(mesh);

  const droplets = [];
  const segments = [];
  const pointCount = Math.max(4, segmentCount + 1);
  const localPoints = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const worldPoints = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const control1 = new THREE.Vector3();
  const control2 = new THREE.Vector3();
  const temp = new THREE.Vector3();
  const curve = new THREE.CubicBezierCurve3();

  for (let index = 0; index < pointCount; index += 1) {
    const droplet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 12),
      material,
    );
    droplet.castShadow = false;
    droplet.visible = false;
    droplets.push(droplet);
    mesh.add(droplet);
  }

  for (let index = 0; index < pointCount - 1; index += 1) {
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius * 0.92, 1, 12),
      material,
    );
    segment.castShadow = false;
    segment.visible = false;
    segments.push(segment);
    mesh.add(segment);
  }

  function setEndpoints(source, target, intensity = 1) {
    resolveWorldPosition(source, start);
    resolveWorldPosition(target, end);

    const verticalDrop = Math.max(0.12, start.y - end.y);
    const horizontal = temp.subVectors(end, start).setY(0).length();
    if (verticalDrop <= 0.02 || intensity <= 0.01) {
      reset();
      return false;
    }

    control1.copy(start);
    control1.y = start.y - Math.max(0.08, Math.min(0.16, verticalDrop * 0.24));
    control2.copy(end);
    control2.y = end.y + Math.max(0.24, (verticalDrop * 0.78) + (horizontal * 0.22));

    curve.v0.copy(start);
    curve.v1.copy(control1);
    curve.v2.copy(control2);
    curve.v3.copy(end);

    for (let index = 0; index < pointCount; index += 1) {
      const t = index / (pointCount - 1);
      curve.getPoint(t, worldPoints[index]);
      worldToParentLocal(parent, worldPoints[index], localPoints[index]);
    }

    for (let index = 0; index < droplets.length; index += 1) {
      const droplet = droplets[index];
      const sizeFactor = THREE.MathUtils.lerp(0.62, 1.08, Math.sin((index / Math.max(1, droplets.length - 1)) * Math.PI));
      droplet.position.copy(localPoints[index]);
      droplet.scale.setScalar(Math.max(0.16, intensity) * sizeFactor);
      droplet.visible = true;
    }

    for (let index = 0; index < segments.length; index += 1) {
      const scaleFactor = THREE.MathUtils.lerp(0.56, 0.98, 1 - Math.abs(((index + 0.5) / segments.length) - 0.5) * 1.2);
      placeSegment(segments[index], localPoints[index], localPoints[index + 1], Math.max(0.14, intensity) * scaleFactor);
    }

    material.opacity = opacity * Math.min(1, intensity);
    material.emissiveIntensity = 0.08 + (0.14 * Math.min(1, intensity));
    mesh.visible = true;
    return true;
  }

  function reset() {
    mesh.visible = false;
    for (const droplet of droplets) {
      droplet.visible = false;
      droplet.scale.setScalar(1);
    }
    for (const segment of segments) {
      segment.visible = false;
      segment.scale.set(1, 1, 1);
      segment.quaternion.identity();
    }
  }

  return { mesh, setEndpoints, reset };
}
