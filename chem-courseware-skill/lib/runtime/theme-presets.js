import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const defaultThemePresetName = 'chem-lab-dark';

const baseChemistry = {
  clearWater: {
    color: 0x9ddfff,
    surfaceColor: 0xe6f8ff,
    opacity: 0.38,
  },
  diluteAcid: {
    color: 0xdff5ff,
    surfaceColor: 0xc9efff,
    opacity: 0.52,
  },
  blueSolution: {
    color: 0x6ab9ff,
    surfaceColor: 0xaadfff,
    opacity: 0.6,
  },
  yellowPrecipitate: {
    color: 0xe9d27f,
    surfaceColor: 0xf3de98,
    opacity: 0.7,
  },
  denseSteam: {
    color: 0xffffff,
    surfaceColor: 0xf4f8fc,
    opacity: 0.18,
  },
  burnerFlame: {
    color: 0xffb347,
    surfaceColor: 0xffd29a,
    opacity: 0.68,
  },
};

const baseMaterials = {
  glass: {
    color: 0xf6fbff,
    opacity: 0.18,
    roughness: 0.08,
    transmission: 0.92,
  },
  metal: {
    color: 0xb7c4d3,
    roughness: 0.34,
    metalness: 0.82,
  },
  ceramic: {
    color: 0xe8edf4,
    roughness: 0.78,
    metalness: 0.04,
  },
  label: {
    color: 0xf7f2e7,
    text: '#1e2430',
    border: '#c8b892',
  },
};

const baseApparatusVariants = {
  bottle: {
    glassTint: 0xf6fbff,
    capColor: 0x1d2430,
    labelColor: 0xf7f2e7,
  },
  jar: {
    glassTint: 0xfafcff,
    capColor: 0x2c3442,
    bandColor: 0xcab58d,
  },
  beaker: {
    glassTint: 0xf8fcff,
    markColor: 0xd8e4f2,
  },
  tube: {
    glassTint: 0xf8fcff,
    rackAccent: 0x6f7f92,
  },
  burner: {
    bodyColor: 0x5a6472,
    nozzleColor: 0xb6c2cf,
    flameColor: 0xffb347,
  },
};

export const themePresets = {
  'chem-lab-dark': {
    scene: {
      background: 0x0b1220,
      fog: { color: 0x09111d, near: 18, far: 38 },
      rendererExposure: 1.15,
      toneMapping: THREE.ACESFilmicToneMapping,
      ambientLight: { skyColor: 0xd7e6ff, groundColor: 0x081018, intensity: 1.18 },
      keyLight: { color: 0xe8f5ff, intensity: 1.9, position: [8, 14, 10] },
      rimLight: { color: 0x67d8ff, intensity: 3.7, distance: 28, decay: 2, position: [-1, 8, -10] },
      warmLight: { color: 0xffb76b, intensity: 4.8, distance: 28, decay: 2, position: [-3.5, 5.8, 3.5] },
      bench: 0x2b3444,
      benchLeg: 0x59677a,
      floor: 0x121e2f,
      room: 0x0b1220,
    },
    ui: {
      panel: 'rgba(14, 22, 38, 0.84)',
      panelSoft: 'rgba(14, 22, 38, 0.72)',
      border: 'rgba(255,255,255,0.12)',
      text: '#f4f7fb',
      muted: '#c9d4e4',
      accent: '#f0b25a',
      warm: '#e47d3f',
      buttonPrimary: 'linear-gradient(135deg, #f0b25a, #e47d3f)',
      buttonSecondary: 'rgba(255,255,255,0.12)',
    },
    materials: baseMaterials,
    chemistry: baseChemistry,
    apparatusVariants: baseApparatusVariants,
  },
  'classroom-light': {
    scene: {
      background: 0xe8edf4,
      fog: { color: 0xdce5ef, near: 24, far: 48 },
      rendererExposure: 0.98,
      toneMapping: THREE.ACESFilmicToneMapping,
      ambientLight: { skyColor: 0xffffff, groundColor: 0xc4ceda, intensity: 1.45 },
      keyLight: { color: 0xffffff, intensity: 1.6, position: [7, 13, 9] },
      rimLight: { color: 0xb7d7ff, intensity: 2.2, distance: 26, decay: 2, position: [-2, 7, -9] },
      warmLight: { color: 0xffe3b0, intensity: 2.2, distance: 20, decay: 2, position: [-3, 4.8, 4] },
      bench: 0xd4c2a7,
      benchLeg: 0x7b8794,
      floor: 0xcfd9e4,
      room: 0xe8edf4,
    },
    ui: {
      panel: 'rgba(255, 255, 255, 0.88)',
      panelSoft: 'rgba(255, 255, 255, 0.72)',
      border: 'rgba(32, 50, 76, 0.16)',
      text: '#1f2a38',
      muted: '#556579',
      accent: '#2f6fb3',
      warm: '#c6762d',
      buttonPrimary: 'linear-gradient(135deg, #4d8fd6, #2f6fb3)',
      buttonSecondary: 'rgba(32, 50, 76, 0.08)',
    },
    materials: {
      ...baseMaterials,
      glass: {
        ...baseMaterials.glass,
        color: 0xffffff,
        opacity: 0.14,
      },
      label: {
        ...baseMaterials.label,
        color: 0xffffff,
        text: '#213040',
      },
    },
    chemistry: baseChemistry,
    apparatusVariants: {
      ...baseApparatusVariants,
      bottle: {
        ...baseApparatusVariants.bottle,
        capColor: 0x3f4a58,
      },
      burner: {
        ...baseApparatusVariants.burner,
        bodyColor: 0x6f7c8b,
      },
    },
  },
  'focus-demo': {
    scene: {
      background: 0x090c12,
      fog: { color: 0x090c12, near: 20, far: 34 },
      rendererExposure: 1.08,
      toneMapping: THREE.ACESFilmicToneMapping,
      ambientLight: { skyColor: 0xe2ecff, groundColor: 0x090c12, intensity: 1.02 },
      keyLight: { color: 0xf8fbff, intensity: 2.2, position: [6.5, 12.5, 9] },
      rimLight: { color: 0x8bdcff, intensity: 4.2, distance: 24, decay: 2, position: [-1.2, 7.5, -8.5] },
      warmLight: { color: 0xffc36f, intensity: 3.6, distance: 20, decay: 2, position: [-2.5, 5.1, 3.6] },
      bench: 0x191f29,
      benchLeg: 0x495567,
      floor: 0x0d1219,
      room: 0x090c12,
    },
    ui: {
      panel: 'rgba(10, 14, 20, 0.72)',
      panelSoft: 'rgba(10, 14, 20, 0.52)',
      border: 'rgba(255,255,255,0.18)',
      text: '#fbfdff',
      muted: '#ced8e6',
      accent: '#7ed1ff',
      warm: '#ffb866',
      buttonPrimary: 'linear-gradient(135deg, #7ed1ff, #4fa7dd)',
      buttonSecondary: 'rgba(255,255,255,0.1)',
    },
    materials: {
      ...baseMaterials,
      glass: {
        ...baseMaterials.glass,
        opacity: 0.16,
      },
      metal: {
        ...baseMaterials.metal,
        color: 0xd4dde8,
      },
    },
    chemistry: baseChemistry,
    apparatusVariants: {
      ...baseApparatusVariants,
      beaker: {
        ...baseApparatusVariants.beaker,
        markColor: 0xe6f2ff,
      },
      tube: {
        ...baseApparatusVariants.tube,
        rackAccent: 0x97a6b7,
      },
    },
  },
};

themePresets['dark-lab'] = themePresets['chem-lab-dark'];
themePresets['chem-lab-v1'] = themePresets['chem-lab-dark'];

function cloneArray(value) {
  return Array.isArray(value) ? value.map(cloneValue) : value;
}

function cloneObject(value) {
  if (!value || typeof value !== 'object') {
    return value;
  }
  const entries = Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)]);
  return Object.fromEntries(entries);
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return cloneArray(value);
  }
  if (value && typeof value === 'object') {
    return cloneObject(value);
  }
  return value;
}

function mergeThemeSection(baseSection, overrideSection) {
  if (!overrideSection) {
    return cloneObject(baseSection);
  }
  const merged = cloneObject(baseSection);
  for (const [key, value] of Object.entries(overrideSection)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
      merged[key] = mergeThemeSection(merged[key], value);
      continue;
    }
    merged[key] = cloneValue(value);
  }
  return merged;
}

export function getThemePreset(theme = defaultThemePresetName) {
  if (typeof theme === 'string') {
    return cloneObject(themePresets[theme] || themePresets[defaultThemePresetName]);
  }

  const baseTheme = themePresets[defaultThemePresetName];
  return {
    scene: mergeThemeSection(baseTheme.scene, theme?.scene),
    ui: mergeThemeSection(baseTheme.ui, theme?.ui),
    materials: mergeThemeSection(baseTheme.materials, theme?.materials),
    chemistry: mergeThemeSection(baseTheme.chemistry, theme?.chemistry),
    apparatusVariants: mergeThemeSection(baseTheme.apparatusVariants, theme?.apparatusVariants),
  };
}
