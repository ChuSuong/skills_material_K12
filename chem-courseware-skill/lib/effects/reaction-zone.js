import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function resolveZoneObject(zone) {
  return zone?.object || zone?.group || zone?.apparatus?.group || null;
}

function resolveZoneValue(value, fallback) {
  return typeof value === 'function' ? value() : value ?? fallback;
}

function resolveZoneRadius(zone) {
  const apparatus = zone?.apparatus || null;
  const baseRadius = apparatus?.constraints?.innerRadius ?? 0.5;
  const radiusScale = resolveZoneValue(zone?.radiusScale, 1);
  const radiusPadding = resolveZoneValue(zone?.radiusPadding, 0);
  return Math.max(0.001, resolveZoneValue(zone?.radius, baseRadius * radiusScale) - radiusPadding);
}

function resolveZoneMinY(zone) {
  return resolveZoneValue(zone?.minY, 0);
}

function resolveZoneMaxY(zone) {
  const apparatus = zone?.apparatus || null;
  const minY = resolveZoneMinY(zone);
  const fillHeight = apparatus?.state?.fillHeight;
  const fallbackMax = apparatus?.constraints?.safeFillHeight
    ?? apparatus?.constraints?.innerHeight
    ?? apparatus?.anchors?.mouth?.position?.y
    ?? 1;
  const headroom = resolveZoneValue(zone?.headroom, zone?.liquidOnly ? 0.03 : 0.08);
  const maxY = zone?.liquidOnly && Number.isFinite(fillHeight)
    ? fillHeight + headroom
    : resolveZoneValue(zone?.maxY, fallbackMax + headroom);
  return Math.max(minY + 0.001, maxY);
}

export function createVesselReactionZone({
  apparatus = null,
  object = null,
  group = null,
  name = 'vessel-reaction-zone',
  radius = null,
  radiusScale = 0.92,
  radiusPadding = 0,
  minY = 0,
  maxY = null,
  headroom = null,
  liquidOnly = false,
} = {}) {
  const zone = {
    name,
    apparatus,
    object: object || group || apparatus?.group || null,
    radius,
    radiusScale,
    radiusPadding,
    minY,
    maxY,
    headroom,
    liquidOnly,
  };

  zone.getRadius = () => resolveZoneRadius(zone);
  zone.getMinY = () => resolveZoneMinY(zone);
  zone.getMaxY = () => resolveZoneMaxY(zone);
  return zone;
}

export function reactionZoneContainsLocalPoint(zone, localPoint, {
  radiusPadding = 0,
  yPadding = 0,
} = {}) {
  if (!zone || !localPoint) {
    return true;
  }
  const radius = Math.max(0.001, resolveZoneRadius(zone) - radiusPadding);
  const minY = resolveZoneMinY(zone) + yPadding;
  const maxY = resolveZoneMaxY(zone) - yPadding;
  return Math.hypot(localPoint.x, localPoint.z) <= radius
    && localPoint.y >= minY
    && localPoint.y <= maxY;
}

export function clampLocalPointToReactionZone(zone, localPoint, {
  radiusPadding = 0,
  yPadding = 0,
} = {}) {
  const result = {
    ok: true,
    radial: false,
    minY: false,
    maxY: false,
  };
  if (!zone || !localPoint) {
    return result;
  }

  const radius = Math.max(0.001, resolveZoneRadius(zone) - radiusPadding);
  const minY = resolveZoneMinY(zone) + yPadding;
  const maxY = resolveZoneMaxY(zone) - yPadding;
  const radialDistance = Math.hypot(localPoint.x, localPoint.z);
  if (radialDistance > radius) {
    const scale = radius / Math.max(radialDistance, 0.001);
    localPoint.x *= scale;
    localPoint.z *= scale;
    result.radial = true;
    result.ok = false;
  }
  if (localPoint.y < minY) {
    localPoint.y = minY;
    result.minY = true;
    result.ok = false;
  }
  if (localPoint.y > maxY) {
    localPoint.y = maxY;
    result.maxY = true;
    result.ok = false;
  }
  return result;
}

export function reactionZoneWorldToLocal(zone, worldPoint, out = new THREE.Vector3()) {
  const object = resolveZoneObject(zone);
  out.copy(worldPoint);
  if (object?.worldToLocal) {
    object.worldToLocal(out);
  }
  return out;
}

export function reactionZoneLocalToWorld(zone, localPoint, out = new THREE.Vector3()) {
  const object = resolveZoneObject(zone);
  out.copy(localPoint);
  if (object?.localToWorld) {
    object.localToWorld(out);
  }
  return out;
}

export function clampParticleToReactionZone({
  particle,
  pool,
  zone,
  radiusPadding = 0,
  yPadding = 0,
} = {}) {
  const object = resolveZoneObject(zone);
  if (!particle || !object?.worldToLocal || !object?.localToWorld) {
    return { ok: true, radial: false, minY: false, maxY: false };
  }

  const world = particle.origin.clone();
  pool?.points?.parent?.localToWorld?.(world);
  object.worldToLocal(world);
  const result = clampLocalPointToReactionZone(zone, world, { radiusPadding, yPadding });
  object.localToWorld(world);
  pool?.points?.parent?.worldToLocal?.(world);
  particle.origin.copy(world);
  return result;
}

export function particlePoolContainedInReactionZone(pool, zone, {
  activeOnly = true,
  radiusPadding = 0,
  yPadding = 0,
} = {}) {
  const object = resolveZoneObject(zone);
  if (!pool?.particles || !object?.worldToLocal) {
    return true;
  }

  const world = new THREE.Vector3();
  const local = new THREE.Vector3();
  return pool.particles.every((particle) => {
    if (activeOnly && !particle.active) {
      return true;
    }
    world.copy(particle.origin);
    pool.points?.parent?.localToWorld?.(world);
    object.worldToLocal(local.copy(world));
    return reactionZoneContainsLocalPoint(zone, local, { radiusPadding, yPadding });
  });
}

export function objectContainedInReactionZone(objectOrApparatus, zone, {
  present = true,
  radiusPadding = 0,
  yPadding = 0,
} = {}) {
  if (!present) {
    return true;
  }

  const object = objectOrApparatus?.group || objectOrApparatus;
  const zoneObject = resolveZoneObject(zone);
  if (!object || !zoneObject?.worldToLocal) {
    return true;
  }

  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return true;
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  zoneObject.worldToLocal(center);

  const radialHalfExtent = Math.max(size.x, size.z) * 0.5;
  const verticalHalfExtent = size.y * 0.5;
  return reactionZoneContainsLocalPoint(zone, center, {
    radiusPadding: radiusPadding + radialHalfExtent,
    yPadding: yPadding + verticalHalfExtent,
  });
}
