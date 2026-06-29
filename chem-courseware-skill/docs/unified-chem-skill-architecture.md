# Unified Chemistry Skill Architecture

The repository keeps the standalone HTML delivery model, but moves fragile repeated code into deterministic compiler, runtime, and verifier layers.

## Pipeline

1. Route the lesson request to a chemistry courseware skill.
2. Produce one semantic draft.
3. Compile the draft into HUD, scene, and metadata artifacts.
4. Assemble those artifacts into standalone HTML.
5. Run format, smoke, canvas, interaction, visibility, and packaging checks.
6. Iterate on the draft or runtime, not by hand-copying scene-local helpers.

## Runtime ownership

- `lib/apparatus/*` owns apparatus presets, anchors, constraints, controllers, interactions, and validators.
- `lib/runtime/*` and `lib/interaction/*` own scene shell and direct manipulation helpers.
- `templates/*-inline-snippet.js` are generated runtime bundles for standalone HTML.
- `scripts/pw-*.mjs` own verification surfaces and golden-path execution.

## V1 boundary

V1 compiles semantic drafts and assembles standalone HTML. A full object/interactions scene-spec DSL is intentionally left for V2 after the compiler and verifier are stable.

V1 standalone output allows approved CDN vendor imports. Strict no-network/offline bundling should be handled as a later packager/export mode, not by asking the agent to hand-copy more library code into scenes.
