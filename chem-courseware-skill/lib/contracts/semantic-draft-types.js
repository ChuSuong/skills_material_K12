export const COURSEWARE_KINDS = ['experiment', 'visualization', 'storyboard'];
export const RENDER_MODES = ['threejs', 'dom'];
export const PRIMARY_MODES = ['direct-manipulation', 'guided-observation', 'step-story'];

export const DEFAULT_HUD = {
  requiredSelectors: [
    '#statusText',
    '#statusSub',
    '[data-action="autoplay"]',
    '[data-action="reset"]',
  ],
};

export const DEFAULT_OUTPUT = {
  selfContained: true,
};

export const DEFAULT_VERIFICATION = {
  requiresFormat: true,
  requiresSmoke: true,
  requiresCanvas: true,
  requiresInteraction: true,
  requiresVisibility: true,
  requiresOffline: true,
};
