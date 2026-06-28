import { createReactionFlow } from './reaction-flow.js';

const indicatorOutcomes = {
  acid: { state: 'acid-contact', color: 'red' },
  base: { state: 'base-contact', color: 'blue' },
  neutral: { state: 'neutral-contact', color: 'purple' },
};

export function createAcidBaseIndicatorReaction({
  indicator,
  getSolutionType,
  duration = 0.8,
  onContact,
} = {}) {
  return createReactionFlow({
    id: 'acid-base-indicator',
    duration,
    onStart({ state }) {
      const solutionType = getSolutionType?.() || 'neutral';
      const outcome = indicatorOutcomes[solutionType] || indicatorOutcomes.neutral;
      indicator?.controllers?.setIndicatorState?.(outcome.state);
      indicator?.setIndicatorState?.(outcome.state);
      state.solutionType = solutionType;
      state.outcomeColor = outcome.color;
      onContact?.({ solutionType, outcome, state });
    },
    onReset() {
      indicator?.controllers?.setIndicatorState?.('ready');
      indicator?.setIndicatorState?.('ready');
    },
  });
}
