# Generated Artifact Contract

This contract applies to the new V1 `compileSemanticDraft()` -> `assembleCourseware()`
pipeline. It does not describe every legacy/generated example already present under
`generated/`.

Generated artifacts are the stable handoff from compiler to assembler and verification.

## Draft artifacts

`compileSemanticDraft()` writes exactly:

- `<slug>.hud.html`
- `<slug>.scene.js`
- `<slug>.meta.json`

`hud.html` contains learner UI, `scene.js` contains runtime scene logic, and `meta.json` contains lesson metadata.

## Assembled output

`assembleCourseware()` writes:

- `generated/<kind>/<slug>/index.html`
- `generated/<kind>/<slug>/hud.html`
- `generated/<kind>/<slug>/scene.js`
- `generated/<kind>/<slug>/metadata.json`

`metadata.json` starts with `verify_status: "pending"` and should be updated by the verification pipeline.

For active classic chemistry recipes, `index.html` must inline the classic-only apparatus bundle rather than the compatibility apparatus bundle.

Nested output trees such as `generated/experiment/experiment/<slug>/...` are not canonical and should be treated as stale generated artifacts.

## Standalone policy

- The final HTML must not import repo-local helper modules.
- Three.js may load from the approved jsDelivr CDN in V1.
- V1 "standalone" means a single importable HTML artifact with inlined courseware runtime helpers and CDN allowlisted vendor imports. Strict no-network/offline delivery is a future packaging mode.
- The page must expose stable verifier selectors and `__coursewareTestApi` or `__flameTestApi`.
