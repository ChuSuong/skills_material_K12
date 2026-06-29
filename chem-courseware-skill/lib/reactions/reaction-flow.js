export function createReactionFlow({
  id = 'reaction-flow',
  duration = 2,
  initialPhase = 'idle',
  successPhase = 'result',
  autoplayStep = 'run-reaction-autoplay',
  effects = [],
  status = {},
  onStart,
  onUpdate,
  onAfterFinishUpdate,
  onFinish,
  onReset,
} = {}) {
  const state = {
    id,
    phase: initialPhase,
    t: 0,
    progress: 0,
    mode: null,
    hasManualResult: false,
    hasAutoplayResult: false,
  };

  function start(mode = 'manual') {
    state.phase = 'reaction';
    state.t = 0;
    state.progress = 0;
    state.mode = mode;
    state.hasManualResult = mode === 'manual';
    state.hasAutoplayResult = mode === 'autoplay';
    onStart?.({ state, mode });
    return true;
  }

  function finish() {
    state.phase = successPhase;
    state.progress = 1;
    for (const effect of effects) {
      effect.setProgress?.(1);
    }
    onFinish?.({ state });
    return true;
  }

  function update(dt = 1 / 60, elapsed = performance.now() / 1000) {
    if (state.phase !== 'reaction') {
      if (state.phase === successPhase) {
        onAfterFinishUpdate?.({ state, dt, elapsed });
      }
      return state;
    }

    state.t += dt;
    state.progress = Math.min(1, state.t / Math.max(duration, 0.001));
    for (const effect of effects) {
      effect.setProgress?.(state.progress, elapsed, state);
    }
    onUpdate?.({ state, dt, elapsed });

    if (state.progress >= 1) {
      finish();
    }
    return state;
  }

  function reset() {
    state.phase = initialPhase;
    state.t = 0;
    state.progress = 0;
    state.mode = null;
    state.hasManualResult = false;
    state.hasAutoplayResult = false;
    for (const effect of effects) {
      effect.reset?.();
    }
    onReset?.({ state });
    return true;
  }

  function autoplay() {
    return start('autoplay');
  }

  return {
    id,
    state,
    status,
    start,
    autoplay,
    update,
    finish,
    reset,
    getState() {
      return { ...state };
    },
    getVerifierMeta() {
      return { successPhase, supportsGoldenPath: true };
    },
    getGoldenPath() {
      return [{ type: autoplayStep, afterMs: Math.round(duration * 1000 + 250) }];
    },
    runVerifierStep(step) {
      if (step?.type === autoplayStep || step?.type === 'run-autoplay') {
        autoplay();
        state.t = duration;
        state.progress = 1;
        finish();
        return true;
      }
      return false;
    },
  };
}
