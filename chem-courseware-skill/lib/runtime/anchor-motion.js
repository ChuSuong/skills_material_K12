import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function getAnchorMotionAnchor(target, anchorName = null) {
  if (!target) {
    return null;
  }
  if (anchorName && target.anchors?.[anchorName]) {
    return target.anchors[anchorName];
  }
  if (typeof target.getWorldPosition === 'function' || target.isVector3) {
    return target;
  }
  return target.group || null;
}

function getAnchorMotionWorldPoint(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

function toAnchorMotionParentLocal(parent, worldPoint, out = new THREE.Vector3()) {
  out.copy(worldPoint);
  if (typeof parent?.worldToLocal === 'function') {
    parent.worldToLocal(out);
  }
  return out;
}

function cloneAnchorMotionRotation(rotation) {
  return new THREE.Euler(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0, rotation?.order || 'XYZ');
}

function resolveAnchorMotionRotation(rotation) {
  if (!rotation) {
    return null;
  }
  if (rotation.isEuler) {
    return cloneAnchorMotionRotation(rotation);
  }
  if (Array.isArray(rotation)) {
    return new THREE.Euler(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0, rotation[3] || 'XYZ');
  }
  return new THREE.Euler(rotation.x || 0, rotation.y || 0, rotation.z || 0, rotation.order || 'XYZ');
}

export function computeAnchorPlacementPose({
  source,
  sourceAnchor = 'interactionZone',
  target,
  targetAnchor = 'effectOrigin',
  parent = null,
  offset = [0, 0, 0],
  rotation = null,
} = {}) {
  const sourceObject = source?.group || source;
  const sourceAnchorObject = getAnchorMotionAnchor(source, sourceAnchor);
  const targetAnchorObject = getAnchorMotionAnchor(target, targetAnchor);
  if (!sourceObject || !sourceAnchorObject || !targetAnchorObject) {
    throw new Error('computeAnchorPlacementPose requires source object, source anchor, and target anchor');
  }

  const originalPosition = sourceObject.position.clone();
  const originalRotation = cloneAnchorMotionRotation(sourceObject.rotation);
  const placementRotation = resolveAnchorMotionRotation(rotation) || originalRotation.clone();

  sourceObject.rotation.copy(placementRotation);
  sourceObject.updateMatrixWorld(true);

  const targetWorld = getAnchorMotionWorldPoint(targetAnchorObject, new THREE.Vector3());
  const targetLocal = toAnchorMotionParentLocal(parent, targetWorld, new THREE.Vector3()).add(
    new THREE.Vector3(offset[0] || 0, offset[1] || 0, offset[2] || 0),
  );
  const sourceWorld = getAnchorMotionWorldPoint(sourceAnchorObject, new THREE.Vector3());
  const sourceLocal = toAnchorMotionParentLocal(parent, sourceWorld, new THREE.Vector3());
  const position = sourceObject.position.clone().add(targetLocal.sub(sourceLocal));

  sourceObject.position.copy(originalPosition);
  sourceObject.rotation.copy(originalRotation);
  sourceObject.updateMatrixWorld(true);

  return { position, rotation: placementRotation };
}

export function applyAnchorPlacement(options = {}) {
  const sourceObject = options.source?.group || options.source;
  const pose = computeAnchorPlacementPose(options);
  sourceObject.position.copy(pose.position);
  sourceObject.rotation.copy(pose.rotation);
  sourceObject.updateMatrixWorld(true);
  return pose;
}

export function createGuidedAnchorMotion({
  source,
  sourceAnchor,
  target,
  targetAnchor,
  parent = null,
  offset = [0, 0, 0],
  rotation = null,
  duration = 1.2,
  easing = (value) => THREE.MathUtils.smoothstep(value, 0, 1),
  dragController = null,
  onStart,
  onUpdate,
  onComplete,
} = {}) {
  const sourceObject = source?.group || source;
  const state = {
    active: false,
    t: 0,
    duration,
    progress: 0,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromRotation: new THREE.Euler(),
    toRotation: new THREE.Euler(),
  };

  function start(extra = {}) {
    if (!sourceObject || state.active) {
      return false;
    }
    const pose = computeAnchorPlacementPose({
      source,
      sourceAnchor,
      target,
      targetAnchor,
      parent,
      offset,
      rotation,
      ...extra,
    });
    state.active = true;
    state.t = 0;
    state.progress = 0;
    state.fromPosition.copy(sourceObject.position);
    state.toPosition.copy(pose.position);
    state.fromRotation.copy(sourceObject.rotation);
    state.toRotation.copy(pose.rotation);
    dragController?.setEnabled?.(false);
    onStart?.({ state, pose });
    return true;
  }

  function update(dt = 1 / 60) {
    if (!state.active || !sourceObject) {
      return state;
    }

    state.t += dt;
    state.progress = Math.min(1, state.t / Math.max(state.duration, 0.001));
    const eased = easing(state.progress);
    sourceObject.position.lerpVectors(state.fromPosition, state.toPosition, eased);
    sourceObject.rotation.x = THREE.MathUtils.lerp(state.fromRotation.x, state.toRotation.x, eased);
    sourceObject.rotation.y = THREE.MathUtils.lerp(state.fromRotation.y, state.toRotation.y, eased);
    sourceObject.rotation.z = THREE.MathUtils.lerp(state.fromRotation.z, state.toRotation.z, eased);
    onUpdate?.({ state, eased });

    if (state.progress >= 1) {
      state.active = false;
      dragController?.setEnabled?.(true);
      sourceObject.position.copy(state.toPosition);
      sourceObject.rotation.copy(state.toRotation);
      onComplete?.({ state });
    }

    return state;
  }

  function cancel({ restoreDrag = true } = {}) {
    state.active = false;
    state.t = 0;
    state.progress = 0;
    if (restoreDrag) {
      dragController?.setEnabled?.(true);
    }
    return state;
  }

  return {
    state,
    start,
    update,
    cancel,
    get active() {
      return state.active;
    },
  };
}

export function createGuidedPourMotion({
  source,
  sourceAnchor,
  target,
  targetAnchor,
  parent = null,
  offset = [0, 0, 0],
  rotation = null,
  approachDuration = 0.9,
  pourDuration = 0.95,
  easing = (value) => THREE.MathUtils.smoothstep(value, 0, 1),
  dragController = null,
  stream = null,
  streamSource = null,
  streamTarget = null,
  intensityCurve = (value) => THREE.MathUtils.clamp(0.18 + (value * 0.92), 0, 1),
  successId = null,
  successBehavior = 'return-home',
  successReturnDelayMs = 0,
  onStart,
  onApproachStart,
  onApproachUpdate,
  onPourStart,
  onPourUpdate,
  onPourComplete,
  onComplete,
} = {}) {
  const sourceObject = source?.group || source;
  const state = {
    active: false,
    phase: 'idle',
    t: 0,
    progress: 0,
    approachProgress: 0,
    pourProgress: 0,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromRotation: new THREE.Euler(),
    toRotation: new THREE.Euler(),
    options: {
      target,
      targetAnchor,
      offset,
      rotation,
      streamSource,
      streamTarget,
    },
  };

  function getResolvedAnchor(targetRef, anchorName = null) {
    if (!targetRef) {
      return null;
    }
    if (anchorName && targetRef.anchors?.[anchorName]) {
      return targetRef.anchors[anchorName];
    }
    if (typeof targetRef?.getWorldPosition === 'function' || targetRef?.isVector3) {
      return targetRef;
    }
    return targetRef.group || targetRef;
  }

  function resetStream() {
    stream?.reset?.();
  }

  function finishPour() {
    state.active = false;
    state.phase = 'complete';
    state.progress = 1;
    state.approachProgress = 1;
    state.pourProgress = 1;
    resetStream();
    dragController?.setEnabled?.(true);
    if (successId && dragController?.commitSuccess) {
      dragController.commitSuccess(successId, {
        successBehavior,
        successReturnDelayMs,
      });
    }
    onPourComplete?.({ state });
    onComplete?.({ state });
    return true;
  }

  function start(extra = {}) {
    if (!sourceObject || state.active) {
      return false;
    }

    state.options = {
      target: extra.target || target,
      targetAnchor: extra.targetAnchor || targetAnchor,
      offset: extra.offset || offset,
      rotation: extra.rotation || rotation,
      streamSource: extra.streamSource || streamSource,
      streamTarget: extra.streamTarget || streamTarget,
    };

    const pose = computeAnchorPlacementPose({
      source,
      sourceAnchor,
      target: state.options.target,
      targetAnchor: state.options.targetAnchor,
      parent,
      offset: state.options.offset,
      rotation: state.options.rotation,
    });

    state.active = true;
    state.phase = 'approach';
    state.t = 0;
    state.progress = 0;
    state.approachProgress = 0;
    state.pourProgress = 0;
    state.fromPosition.copy(sourceObject.position);
    state.toPosition.copy(pose.position);
    state.fromRotation.copy(sourceObject.rotation);
    state.toRotation.copy(pose.rotation);
    dragController?.setEnabled?.(false);
    onStart?.({ state, pose });
    onApproachStart?.({ state, pose });
    return true;
  }

  function update(dt = 1 / 60) {
    if (!state.active || !sourceObject) {
      return state;
    }

    if (state.phase === 'approach') {
      state.t += dt;
      state.approachProgress = Math.min(1, state.t / Math.max(approachDuration, 0.001));
      state.progress = state.approachProgress;
      const eased = easing(state.approachProgress);
      sourceObject.position.lerpVectors(state.fromPosition, state.toPosition, eased);
      sourceObject.rotation.x = THREE.MathUtils.lerp(state.fromRotation.x, state.toRotation.x, eased);
      sourceObject.rotation.y = THREE.MathUtils.lerp(state.fromRotation.y, state.toRotation.y, eased);
      sourceObject.rotation.z = THREE.MathUtils.lerp(state.fromRotation.z, state.toRotation.z, eased);
      onApproachUpdate?.({ state, eased });

      if (state.approachProgress >= 1) {
        sourceObject.position.copy(state.toPosition);
        sourceObject.rotation.copy(state.toRotation);
        state.phase = 'pour';
        state.t = 0;
        state.progress = 0;
        onPourStart?.({ state });
      }
      return state;
    }

    if (state.phase === 'pour') {
      state.t += dt;
      state.pourProgress = Math.min(1, state.t / Math.max(pourDuration, 0.001));
      state.progress = state.pourProgress;
      sourceObject.position.copy(state.toPosition);
      sourceObject.rotation.copy(state.toRotation);
      const resolvedStreamSource = getResolvedAnchor(state.options.streamSource || source, sourceAnchor);
      const resolvedStreamTarget = getResolvedAnchor(
        state.options.streamTarget
          || state.options.target?.meshes?.liquidSurface
          || state.options.target?.anchors?.pourTarget
          || state.options.target?.anchors?.mouth
          || (state.options.targetAnchor ? state.options.target : null)
          || state.options.target,
        state.options.streamTarget
          ? null
          : (state.options.target?.anchors?.pourTarget ? 'pourTarget'
            : state.options.target?.anchors?.mouth ? 'mouth' : state.options.targetAnchor),
      );
      stream?.setEndpoints?.(
        resolvedStreamSource,
        resolvedStreamTarget,
        intensityCurve(state.pourProgress),
      );
      onPourUpdate?.({ state });
      if (state.pourProgress >= 1) {
        finishPour();
      }
    }

    return state;
  }

  function cancel({ restoreDrag = true } = {}) {
    state.active = false;
    state.phase = 'idle';
    state.t = 0;
    state.progress = 0;
    state.approachProgress = 0;
    state.pourProgress = 0;
    resetStream();
    if (restoreDrag) {
      dragController?.setEnabled?.(true);
    }
    return state;
  }

  return {
    state,
    start,
    update,
    cancel,
    finish: finishPour,
    get active() {
      return state.active;
    },
  };
}

export function createSequencedPourController({
  dragController = null,
  steps = [],
  isMotionActive = () => false,
  onPendingStart,
  onStepStart,
  onStepComplete,
  onStateChange,
} = {}) {
  const stepMap = new Map(
    steps
      .filter((step) => step?.stepId && step?.sourceId && step?.motion)
      .map((step) => [step.stepId, step]),
  );

  const state = {
    mode: 'idle',
    queue: [],
    pendingStepId: null,
    pendingMode: null,
    activeStepId: null,
    stagedSourceId: null,
  };

  function notifyStateChange() {
    onStateChange?.({ state });
  }

  function getStepConfig(stepId) {
    return stepMap.get(stepId) || null;
  }

  function nextQueuedStepUsesSource(sourceId) {
    const nextStepId = state.queue[0];
    if (!nextStepId) {
      return false;
    }
    return getStepConfig(nextStepId)?.sourceId === sourceId;
  }

  function canStartStep(stepId) {
    const config = getStepConfig(stepId);
    if (!config || state.pendingStepId || state.activeStepId || isMotionActive()) {
      return false;
    }
    if (!dragController?.canStartSequencedMotion) {
      return true;
    }
    return dragController.canStartSequencedMotion(config.sourceId, {
      allowStaged: state.stagedSourceId === config.sourceId,
    });
  }

  function beginStep(stepId, mode = 'manual') {
    const config = getStepConfig(stepId);
    if (!config || !canStartStep(stepId)) {
      return false;
    }
    state.pendingStepId = stepId;
    state.pendingMode = mode;
    state.mode = mode === 'autoplay' ? 'autoplay' : 'manual';
    notifyStateChange();
    onPendingStart?.({ state, config, mode });

    const started = config.motion.start(
      typeof config.startArgs === 'function' ? config.startArgs({ state, config, mode }) : (config.startArgs || {}),
    );
    if (!started) {
      state.pendingStepId = null;
      state.pendingMode = null;
      state.mode = state.queue.length ? 'autoplay' : 'idle';
      notifyStateChange();
      return false;
    }
    return true;
  }

  // Like beginStep but skips the dragController.canStartSequencedMotion check.
  // Use this when the source is being actively dragged (isAtHome === false by design).
  function beginStepFromActiveDrag(stepId) {
    const config = getStepConfig(stepId);
    if (!config || state.pendingStepId || state.activeStepId || isMotionActive()) {
      return false;
    }
    state.pendingStepId = stepId;
    state.pendingMode = 'manual';
    state.mode = 'manual';
    notifyStateChange();
    onPendingStart?.({ state, config, mode: 'manual' });
    const started = config.motion.start(
      typeof config.startArgs === 'function'
        ? config.startArgs({ state, config, mode: 'manual' })
        : (config.startArgs || {}),
    );
    if (!started) {
      state.pendingStepId = null;
      state.pendingMode = null;
      state.mode = state.queue.length ? 'autoplay' : 'idle';
      notifyStateChange();
      return false;
    }
    return true;
  }

  function activatePendingStep(sourceId = null) {
    if (!state.pendingStepId) {
      return false;
    }
    const config = getStepConfig(state.pendingStepId);
    if (!config || (sourceId && config.sourceId !== sourceId)) {
      return false;
    }
    const mode = state.pendingMode || state.mode || 'manual';
    state.activeStepId = state.pendingStepId;
    state.pendingStepId = null;
    state.pendingMode = null;
    state.stagedSourceId = config.sourceId;
    notifyStateChange();
    onStepStart?.({ state, config, mode });
    return true;
  }

  function completeActiveStep(sourceId = null) {
    if (!state.activeStepId) {
      return false;
    }
    const config = getStepConfig(state.activeStepId);
    if (!config || (sourceId && config.sourceId !== sourceId)) {
      return false;
    }

    const completedMode = state.mode;
    onStepComplete?.({ state, config, mode: completedMode });

    const keepStaged = completedMode === 'autoplay' && nextQueuedStepUsesSource(config.sourceId);
    if (keepStaged) {
      state.stagedSourceId = config.sourceId;
    } else {
      dragController?.commitSuccess?.(config.sourceId, {
        successBehavior: 'return-home',
        successReturnDelayMs: config.returnDelayMs ?? 0,
      });
      state.stagedSourceId = null;
    }

    state.activeStepId = null;
    state.mode = state.queue.length ? 'autoplay' : 'idle';
    notifyStateChange();
    return true;
  }

  function queueAutoplay(stepIds = []) {
    state.queue = stepIds.filter((stepId) => stepMap.has(stepId));
    state.mode = state.queue.length ? 'autoplay' : 'idle';
    notifyStateChange();
    return state.queue.length;
  }

  function shiftQueuedStep() {
    const nextStepId = state.queue.shift() || null;
    state.mode = state.queue.length || state.pendingStepId || state.activeStepId ? 'autoplay' : 'idle';
    notifyStateChange();
    return nextStepId;
  }

  function updateAutoplay() {
    if (!state.queue.length || state.pendingStepId || state.activeStepId || isMotionActive()) {
      return false;
    }
    const nextStepId = state.queue[0];
    if (!canStartStep(nextStepId)) {
      return false;
    }
    shiftQueuedStep();
    return beginStep(nextStepId, 'autoplay');
  }

  function reset() {
    state.mode = 'idle';
    state.queue = [];
    state.pendingStepId = null;
    state.pendingMode = null;
    state.activeStepId = null;
    state.stagedSourceId = null;
    notifyStateChange();
    return true;
  }

  return {
    state,
    getStepConfig,
    nextQueuedStepUsesSource,
    canStartStep,
    beginStep,
    beginStepFromActiveDrag,
    activatePendingStep,
    completeActiveStep,
    queueAutoplay,
    shiftQueuedStep,
    updateAutoplay,
    reset,
  };
}

export function createContextualLabelPolicy({
  apparatus,
  label = {},
} = {}) {
  function show(nextLabel = label) {
    apparatus?.controllers?.setLabel?.(nextLabel);
    return true;
  }

  function hide() {
    apparatus?.controllers?.setLabel?.({});
    return true;
  }

  return { show, hide };
}
