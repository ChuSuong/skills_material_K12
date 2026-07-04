# Semantic Draft Contract

Semantic draft is the planning contract between a lesson request and generated courseware artifacts.

## Required shape

```json
{
  "kind": "experiment | visualization | storyboard",
  "topic": "string",
  "level": "string",
  "skill": "string",
  "language": "vi",
  "renderMode": "threejs | dom",
  "recipe": "optional experiment identifier (slug); set to the experiment slug for 3D experiment scenes",
  "scene": {
    "apparatus": ["string"],
    "cameraPreset": "string",
    "themeVersion": "string"
  },
  "hud": {
    "requiredSelectors": ["#statusText", "#statusSub", "[data-action=\"autoplay\"]", "[data-action=\"reset\"]"],
    "pedagogy": {
      "title": "optional learner-facing title override",
      "formulaHtml": "optional chemistry formula HTML with subscripts/superscripts",
      "intro": "optional learner-facing intro paragraph",
      "hint": "optional pedagogical note",
      "observationTitle": "optional heading for observation card",
      "observations": ["optional learner-facing observation bullets"],
      "questions": [
        {
          "prompt": "optional question prompt",
          "answer": "optional short answer"
        }
      ],
      "statusLabel": "optional status card label",
      "initialStatusText": "optional initial status text",
      "initialStatusSub": "optional initial status explanation",
      "primaryActionLabel": "optional autoplay button label",
      "resetLabel": "optional reset button label"
    }
  },
  "interaction": {
    "primaryMode": "direct-manipulation | guided-observation | step-story",
    "goldenPath": ["string"],
    "resetRequired": true,
    "autoplayRequired": true
  },
  "verification": {
    "requiresFormat": true,
    "requiresSmoke": true,
    "requiresCanvas": true,
    "requiresInteraction": true,
    "requiresVisibility": true,
    "requiresOffline": true
  }
}
```

## Rules

- Validate with `validateSemanticDraft()` before compiling.
- For common 3D experiments, set `recipe` and validate the matching recipe with `validateRecipeDefinition()` before compiling.
- Recipe definitions must contain `steps`. Drag/pour/heat steps must reference apparatus anchors with `apparatus.anchor`, and reaction steps must declare the shared reaction plus `successPhase`.
- For `free-drag` recipes, drag/pour/heat steps must also declare `overlapPadding`. Runtime completion must be object-level overlap against the target apparatus body or interaction region. Anchors are semantic alignment points and final placement references; they must not be the only hit target for learner completion.
- Recipe definitions must contain `resultSustainEffects`. Use an empty array only for intentionally static final states. If the final result should keep flame, steam, smoke, glow, sparks, bubbling, or similar effects alive, list those effect ids and implement sustained result behavior in the shared reaction runtime.
- Write `scene.js` by hand using `lib/apparatus/presets/`, `lib/reactions/`, `lib/effects/`, and `lib/interaction/` as the authoritative source. There is no separate compiler step. Run `scripts/audit-experiment-scene-contract.mjs` before assembling.
- Keep this draft internal; learners receive the assembled HTML.
- Add new fields only when the assembler or verifier consumes them.
- Prefer `hud.pedagogy` over ad-hoc HTML strings when the lesson needs richer learner-facing information cards. The shared pedagogical HUD pattern is in `lib/patterns/pedagogical-hud.mjs`.
- In V1, `verification.requiresOffline` is a gate that the artifact must not depend on repo-local helper files after assembly. CDN allowlisted Three.js imports are still accepted by the assembler and Playwright verifier.
