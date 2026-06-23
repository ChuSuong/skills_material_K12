import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getAnchorWorld, getApparatusId } from './anchors.js';

function normalizeReport(report, defaults = {}) {
  return {
    severity: report?.severity ?? defaults.severity ?? 'warning',
    apparatusId: report?.apparatusId ?? defaults.apparatusId,
    interactionId: report?.interactionId ?? defaults.interactionId,
    ...report,
  };
}

export function validatePourAlignment(sourceApparatus, targetApparatus) {
  const nozzle = getAnchorWorld(sourceApparatus.anchors.nozzle);
  const mouth = getAnchorWorld(targetApparatus.anchors.mouth);
  const dx = nozzle.x - mouth.x;
  const dz = nozzle.z - mouth.z;
  const radialOffset = Math.hypot(dx, dz);
  const verticalClearance = nozzle.y - mouth.y;
  const maxRadius = targetApparatus.constraints.safePourRadius ?? 0.25;
  const minClearance = targetApparatus.constraints.safePourClearance ?? 0.1;
  const ok = radialOffset <= maxRadius && verticalClearance >= minClearance;

  return normalizeReport({
    ok,
    code: 'pour-alignment',
    severity: 'blocker',
    apparatusId: `${getApparatusId(sourceApparatus)}->${getApparatusId(targetApparatus)}`,
    message: ok ? 'Pour alignment ok' : 'Bottle nozzle misses target vessel mouth',
    details: {
      radialOffset,
      verticalClearance,
      maxRadius,
      minClearance,
    },
  });
}

export function validateFillLevel(apparatus, fillHeight) {
  const maxHeight = apparatus.constraints.safeFillHeight ?? apparatus.constraints.innerHeight;
  const ok = fillHeight <= maxHeight;
  return normalizeReport({
    ok,
    code: 'fill-level',
    severity: 'blocker',
    apparatusId: getApparatusId(apparatus),
    message: ok ? 'Fill level ok' : 'Liquid top exceeds safe fill height',
    details: {
      fillHeight,
      maxHeight,
    },
  });
}

function inferEffectBounds(apparatus) {
  if (apparatus?.constraints?.effectBounds) {
    return apparatus.constraints.effectBounds;
  }

  const radius = apparatus?.constraints?.innerRadius ?? 0.5;
  const height = apparatus?.constraints?.innerHeight ?? apparatus?.anchors?.mouth?.position?.y ?? 1;
  const mouthY = apparatus?.anchors?.mouth?.position?.y ?? height;
  const family = apparatus?.family ?? '';

  if (family === 'heated-vessel' || family === 'heat-source') {
    return {
      min: new THREE.Vector3(-radius * 1.2, 0, -radius * 1.2),
      max: new THREE.Vector3(radius * 1.2, mouthY + height * 0.8, radius * 1.2),
    };
  }

  return {
    min: new THREE.Vector3(-radius * 1.15, 0, -radius * 1.15),
    max: new THREE.Vector3(radius * 1.15, mouthY + 0.2, radius * 1.15),
  };
}

export function validateEffectContainment(apparatus, anchorNames = []) {
  const names = anchorNames.length
    ? anchorNames
    : ['effectOrigin', 'steamOrigin', 'bubbleOrigin', 'heatZone', 'flameOrigin'];
  const bounds = inferEffectBounds(apparatus);
  const reports = [];

  for (const anchorName of names) {
    const anchor = apparatus?.anchors?.[anchorName];
    if (!anchor) {
      continue;
    }
    const local = anchor.position;
    const ok =
      local.x >= bounds.min.x &&
      local.x <= bounds.max.x &&
      local.y >= bounds.min.y &&
      local.y <= bounds.max.y &&
      local.z >= bounds.min.z &&
      local.z <= bounds.max.z;

    reports.push(normalizeReport({
      ok,
      code: 'effect-containment',
      severity: 'blocker',
      apparatusId: getApparatusId(apparatus),
      message: ok
        ? `${anchorName} remains inside its allowed apparatus zone`
        : `${anchorName} falls outside its allowed apparatus zone`,
      details: {
        anchorName,
        localPosition: { x: local.x, y: local.y, z: local.z },
        bounds: {
          min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
          max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
        },
      },
    }));
  }

  return reports;
}

function pointIsVisible(camera, point, margin = 0.04) {
  const projected = point.clone().project(camera);
  return (
    Number.isFinite(projected.x) &&
    Number.isFinite(projected.y) &&
    Number.isFinite(projected.z) &&
    projected.z >= -1 &&
    projected.z <= 1 &&
    projected.x >= -1 + margin &&
    projected.x <= 1 - margin &&
    projected.y >= -1 + margin &&
    projected.y <= 1 - margin
  );
}

export function validateVisibility(camera, points = [], options = {}) {
  const margin = options.margin ?? 0.04;
  const failedPoints = points
    .filter((entry) => entry?.point)
    .filter((entry) => !pointIsVisible(camera, entry.point, margin))
    .map((entry) => ({
      label: entry.label,
      apparatusId: entry.apparatusId,
      interactionId: entry.interactionId,
      point: { x: entry.point.x, y: entry.point.y, z: entry.point.z },
    }));
  const ok = failedPoints.length === 0;

  return normalizeReport({
    ok,
    code: 'visibility',
    severity: 'blocker',
    message: ok ? 'All critical reaction points are visible' : 'Critical reaction points are outside camera view',
    details: {
      margin,
      failedPoints,
    },
  });
}

export function runApparatusValidators(validators = []) {
  const reports = validators
    .map((validator) => validator())
    .flat()
    .filter(Boolean)
    .map((report) => normalizeReport(report));
  const failed = reports.filter((entry) => !entry.ok);
  const warnings = failed.filter((entry) => entry.severity !== 'blocker');
  return {
    ok: failed.filter((entry) => entry.severity === 'blocker').length === 0,
    reports,
    failed,
    warnings,
  };
}

export function createSceneValidatorGate({
  apparatuses = [],
  interactions = [],
  camera,
  visibilityPoints = [],
  options = {},
} = {}) {
  return {
    validate() {
      const apparatusReports = runApparatusValidators(
        apparatuses.flatMap((apparatus) => {
          const validators = [];
          if (Array.isArray(apparatus.validators)) {
            validators.push(...apparatus.validators);
          }
          validators.push(() => validateEffectContainment(apparatus));
          return validators;
        })
      );

      const interactionReports = runApparatusValidators(
        interactions.flatMap((interaction) => {
          if (typeof interaction.validate !== 'function') {
            return [];
          }
          return [() => interaction.validate(camera)];
        })
      );

      const criticalPoints = [
        ...visibilityPoints,
        ...interactions.flatMap((interaction) => {
          if (typeof interaction.getVisibilityPoints !== 'function') {
            return [];
          }
          return interaction.getVisibilityPoints();
        }),
      ];
      const visibilityReport = camera
        ? validateVisibility(camera, criticalPoints, options.visibility)
        : normalizeReport({
            ok: true,
            code: 'visibility',
            severity: 'warning',
            message: 'Visibility skipped because no camera was provided',
          });

      const reports = [
        ...apparatusReports.reports,
        ...interactionReports.reports,
        visibilityReport,
      ];
      const failed = reports.filter((report) => !report.ok);
      const warnings = failed.filter((report) => report.severity !== 'blocker');

      return {
        ok: failed.filter((report) => report.severity === 'blocker').length === 0,
        reports,
        failed,
        warnings,
      };
    },
  };
}
