---
name: chem-3d-experiment
description: Build chemistry 3D experiment courseware as self-contained interactive HTML, especially for simulated lab phenomena such as pouring, heating, bubbling, gas release, precipitate formation, color change, glow, smoke, residue, and post-reaction states. Use this whenever the user wants a chemistry lab scene that learners can watch or manipulate directly.
---

# Chemistry 3D experiment

Build a full-screen chemistry experiment that teaches the phenomenon clearly.

## Core goal
Make the chemistry observable, interactive, and visually legible.

## Use this skill for
- reaction demonstrations
- virtual lab manipulation
- before/during/after reaction storytelling
- apparatus-based chemistry scenes
- life-application chemistry scenes with meaningful object interaction
- simulations where user actions trigger a chemical change

## Default implementation style
Build as a **single direct-openable self-contained 3D HTML experience**.
- When possible, generate a semantic draft first, compile it into HUD/scene/meta artifacts, then assemble standalone HTML with `scripts/assemble-courseware.mjs`.
- Follow `docs/generated-artifact-contract.md` for the compiler/assembler handoff and standalone output contract.
- The learner should be able to open the HTML directly in a browser via `file://`.
- The same HTML should also work when served over local HTTP for verification.
- Do not rely on repo-local module imports or filesystem paths that break when the file is opened directly.
- If shared code is needed, inline/bundle it into the HTML or use browser-resolvable URLs.
- Do not rely on repo-local module imports or filesystem paths that break when the file is opened directly.
- Do not rely on `globalThis` symbols that are not explicitly imported/destructured in the same `<script type="module">` scope where they are used.

## Apparatus library hard gate
For apparatus-driven scenes, the shared apparatus library is the source of truth.
- Before writing scene code, list every learner-facing apparatus or specimen in `semantic-draft.json` under `scene.apparatus`.
- For active experiment recipes, treat `lib/classic-kit/apparatus.js` plus `scripts/classic-kit-active-config.mjs` as the canonical surface. Add new active apparatus there, rebuild `templates/classic-apparatus-inline-snippet.js` via `rtk node scripts/build-classic-apparatus-inline-bundle.mjs`, and add/update apparatus tests before generating the scene.
- Use `lib/apparatus/presets.js`, `lib/apparatus/index.js`, and `templates/apparatus-inline-snippet.js` only for compatibility or legacy scenes that have not migrated to `classic-kit`.
- Instantiate apparatus through `createApparatusFromPreset('<key>', ...)` or the matching `create*Apparatus()` factory. Do not build registered apparatus locally with raw `THREE.Mesh`, `CylinderGeometry`, `BoxGeometry`, or ad-hoc helper functions inside the scene.
- Use apparatus anchors (`anchors.mouth`, `anchors.pourTarget`, `anchors.tipAnchor`, `anchors.sampleZone`, `anchors.interactionZone`, `anchors.effectOrigin`, `anchors.labelAnchor`) for reaction zones, drag targets, pour/drip targets, labels, and visual effect origins.
- Top-level placement may use a small number of initial `position`/`rotation` values, but chemistry-triggering coordinates must be derived from anchors.
- Each learner-facing apparatus must expose a visible label via `controllers.setLabel(...)` or a label attached to `labelAnchor`.
- Run `node scripts/audit-experiment-scene-contract.mjs <draft-dir>` before Playwright. Treat any error as invalid output.

## Recipe, interaction, and effect hard gate
For common chemistry experiments, choose a recipe before writing scene code.
- Check `recipes/*.recipe.json` for an existing match such as acid/base indicator, metal displacement, acid/metal gas, dehydration/carbonization, or heating reactions.
- If a matching recipe exists, set `semantic-draft.json.recipe` to that recipe id and use the recipe's theme, camera, interaction, reaction, and effect modules.
- Recipe definitions must include machine-checkable `steps` for drag/drop, pour, heat, reaction progress, and success phase. Do not rely on free-text `goldenPath` alone.
- For any recipe whose `interaction` contains `free-drag`, every drag/drop, drag/pour, and drag/heat step must use object-level overlap completion. Declare `overlapPadding` in the recipe step and make the generated scene pass `overlapObject` plus `overlapPadding` into `createFreeDragController(...).registerDraggable(...)`. Anchors define alignment and final snap pose; they are not the only hit target for learner completion.
- Recipe definitions must declare `resultSustainEffects`. Use an empty array only when the final state is intentionally static. If the reaction has smoke, steam, flame, glow, sparks, bubbling, or any living visual cue that should remain after the reaction reaches 100%, list those effect ids in `resultSustainEffects` and implement sustained result animation through the shared reaction runtime, usually `onAfterFinishUpdate`.
- If `semantic-draft.json.recipe` is set but `scripts/build-recipe-scene.mjs` does not support it, compilation must fail. Add a recipe builder/runtime contract before producing standalone HTML; do not fall back to hand-authored scene code.
- If `scripts/build-recipe-scene.mjs` supports that recipe, do **not** author or edit `<slug>.scene.js` manually. Run `rtk node scripts/compile-semantic-draft.mjs <draft-dir>/semantic-draft.json`; the compiler will emit a `// @generated by scripts/build-recipe-scene.mjs` scene. Treat non-generated scene code for that recipe as invalid.
- If no recipe exists but the experiment type is common, add a recipe and builder first instead of writing a one-off scene.
- For new or unsupported experiments, create `recipe-proposal.json` from `recipes/pattern-catalog.json` using `scripts/propose-recipe-from-pattern.mjs`, then validate it with `scripts/validate-recipe-proposal.mjs`. This is a planning artifact, not learner HTML.
- Do not compile `kind: experiment` + `renderMode: threejs` drafts without `semantic-draft.json.recipe`; the compiler rejects them by design.
- Use `createFreeDragController(...)` for recipe scenes with `free-drag` interactions. Do not add scene-local `pointerdown`, `pointermove`, `pointerup`, or raycast drag loops.
- Use shared effect modules from `ChemSharedLib` such as `createPourStream`, `createBubbleField`, `createSteamField`, `createSparkField`, `createGlowRing`, `createColorTransition`, and `createMaterialProgress`. Do not hand-code these effects in the scene when a shared module exists.
- Use shared reaction modules such as `createAcidBaseIndicatorReaction`, `createMetalDisplacementReaction`, `createDehydrationCarbonizationReaction`, `createAcidMetalGasReaction`, and `createPourIntoVesselReaction` for state, autoplay, reset, and verifier behavior.
- Reaction modules with `resultSustainEffects` must keep those visuals moving during the `result` phase until reset. Do not let flame, steam, smoke, glow, or similar effects freeze at 100%.
- Run `node scripts/audit-recipe-scene-contract.mjs <draft-dir>` whenever `semantic-draft.json.recipe` is set.
- After assembling supported recipe HTML, run `npm run verify:pw:contract` in addition to smoke/canvas/interaction checks. This must fail if draggables, steps, recipe source, or success phase are missing from the final standalone HTML.

Prefer direct interaction on the rendered scene itself over panel-driven UI.
If the learner can plausibly manipulate an object in the scene, make that manipulation the default primary interaction.
Default to object-first interaction: learners should be able to pick up, hold, move, and drag/drop the important scene objects directly whenever that fits the lesson.
Allow free drag/drop and release for learner-manipulable objects unless the chemistry requires a constrained path or placement rule.
- For apparatus scenes, the important apparatus/prop objects (e.g., bottles/beakers/test tubes/droppers/burners/funnels and the key working container) must be learner-manipulable: the scene should support grab/hold/drag/release for these objects using the repo’s direct-manipulation patterns.
When it helps the lesson and does not make the scene confusing, allow objects to be thrown/tossed from the hand-off release gesture instead of snapping them back immediately.
Autoplay, step buttons, or panel controls should stay secondary unless the user explicitly asks for a button-first lesson.

## Camera default rule
Keep the camera stable by default. Do not auto-pan/auto-follow the scene based on internal story progress. Only move or animate the camera when the user explicitly asks for it or when the learning objective truly requires a guided reveal.

A stable camera does not mean a locked camera: when the scene is interaction-first, allow the learner to orbit/zoom the camera normally while they are not dragging an object, and disable camera controls only during active object manipulation when needed.

**Default camera interaction contract (OrbitControls pattern)**
- Set a good default camera pose + `controls.target` so the scene reads immediately on load.
- Enable orbit/zoom via `OrbitControls` (drag background rotates the view).
- On pointerdown:
  - if the raycast hits a learner-manipulable object, start object drag and set `controls.enabled = false`.
  - otherwise, do not intercept the event so OrbitControls can handle background orbit.
- On pointerup/cancel: end drag and restore `controls.enabled = true`.
- In the render loop: call `controls.update()` and do not force `camera.lookAt(...)` each frame.

## Minimal HUD rule
Prefer a minimal HUD.
- Always include: `#statusText`, `#statusSub`, one primary action button (`data-action="autoplay"`), and one reset button (`data-action="reset"`).
- Avoid decorative intro/legend panels unless the user explicitly asks for more explanation on screen.

## In-scene label rule
Use apparatus library labels, not scene-local label systems.
- For beakers, bottles, test tubes, Erlenmeyer flasks, and reagent jars, call `apparatus.controllers.setLabel(...)`; the preset renders a physical label on the vessel body.
- For tools and specimens such as litmus paper, droppers, funnels, alcohol burners, and iron nails, call `apparatus.controllers.setLabel(...)`; the preset renders a readable badge from `labelAnchor`.
- Do not create standalone DOM labels, boxed callout cards, or floating text sprites for registered apparatus unless the library preset is missing label support.
- If label support is missing on an active classic asset, update the `classic-kit` preset first and rebuild `templates/classic-apparatus-inline-snippet.js`. Only touch `templates/apparatus-inline-snippet.js` when you are intentionally maintaining a legacy scene.

## Reuse existing skills
- use `threejs-fundamentals` for scene, camera, lights, renderer, timing, resize handling
- use `threejs-interaction` for dragging, clicking, controls, hover states, and gesture flow
- use `threejs-animation` for liquid motion, bubbles, steam, expansion, glow, particle behavior, and temporal reaction phases
- use `threejs-shaders` for procedural flames/smoke (vertex displacement + fragment noise), additive blending looks, and custom materials
- use `threejs-textures` for gradient/noise canvas/data textures and any texture tuning needed for readability
- use `threejs-postprocessing` for bloom/glow and subtle screen-space polish when the phenomenon’s look matters (flame, sparks, smoke)
- use `threejs-materials` + `threejs-lighting` when realism/legibility matters (PBR tuning, rim/key/fill balance)
- use `threejs-geometry` only when primitives are too limiting for clear apparatus shapes (tubes, custom vessels)
- use `threejs-loaders` only when bundling local assets is justified (avoid remote fetch dependencies)

## Chemistry-specific build checklist
- Identify the apparatus, materials, and any real-world objects that should be physically manipulated.
- Define the learner action.
- Prefer direct manipulation of 3D objects in the scene: grab, hold, drag, drop, tilt, pour, place, open, rotate, touch, or toss the apparatus itself when that action fits the chemistry.
- Treat the important movable objects in the scene as learner-manipulable by default rather than passive props, unless an object is only decorative or must stay fixed for clarity.
- Apply the same direct-manipulation default to life-application scenes such as torches, refrigerators, jars, burners, storage containers, or other household/lab objects when that makes the chemistry more observable.
- Use buttons only for secondary actions such as reset or guided autoplay, not as the main chemistry interaction.
- Define what visual changes prove the chemistry happened.
- Separate the experience into states: ready, active manipulation, reaction, aftermath.
- Keep the experiment area dominant on screen.
- Keep HUD minimal and directly tied to the chemistry.
- Include reset and at least one guided action path.
- When free drag/drop or throwing is enabled, still preserve legibility: avoid chaotic physics that hides the chemistry or breaks the golden path.
- If an object should not be movable, state why in the output logic instead of silently making every object static.

## Interaction default for movable scene objects
- By default, important scene objects should support being picked up and moved directly by the learner.
- Prefer free drag/drop over rigid slot-only interactions unless exact placement is part of the learning goal.
- A valid drop should complete when the dragged object overlaps the target apparatus/body region, not only when one small anchor point lands exactly on another anchor. Use anchors for semantic reference and snapping after completion, but use object overlap for learner-facing hit detection.
- Allow release velocity to carry the object into a short toss/throw motion when that improves the realism or teaching interaction.
- Constrain only when necessary for chemistry correctness, safety logic, or testability.
- Keep one clear golden path even when the learner can move objects freely.
- Do not add throw behavior to fragile glassware or hazardous objects unless the lesson explicitly benefits from that action.
- When an object is throwable, give it readable motion and a stable rest state after landing.
- Make hover, grab, drag, release, and landing states visually clear.

## Interaction implementation note
When using `threejs-interaction`, prefer patterns that let the learner:
- grab and hold scene objects directly
- drag/drop them freely on valid surfaces or within valid volumes
- release them naturally without forced snap-back unless snap-back is required by the lesson
- toss/throw selected objects by release velocity when appropriate
- keep camera controls secondary while dragging and restore them on release
- preserve reset and golden-path testability even with free object motion
- when the repo already provides shared helpers, reuse `lib/interaction/direct-manipulation.js` for pointer normalization, drag-plane intersection, and OrbitControls gating instead of duplicating those helpers inside each HTML
- when the repo already provides shared helpers, reuse `lib/testing/harness.js` for `window.__flameTestApi` wiring and world/canvas projection helpers instead of scene-local Playwright shims
- when the repo already provides shared helpers, reuse `lib/runtime/timeline.js` for repeated timeline math such as normalized segments and smoothing instead of copy/pasting those functions per scene

## Interaction constraints
Free manipulation is the default, but still:
- keep the chemistry readable
- keep apparatus alignment valid
- avoid letting objects escape the visible learning area
- avoid interactions that break the experiment state machine
- avoid decorative freedom that does not support the lesson
- prefer soft constraints, bounds, and valid surfaces over invisible hard locks when possible

## Golden path requirement for free interaction
Even when the scene supports free grabbing, drag/drop, or throwing:
- provide one obvious learner action that advances the chemistry
- ensure that action remains easy to discover
- ensure reset returns all movable objects to a ready state
- ensure Playwright can still trigger a deterministic visible state change

## Apparatus safety note
For apparatus-heavy chemistry scenes:
- movable tools and containers may be free-dragged when appropriate
- keep critical anchors and effect origins derived from the apparatus geometry
- do not let free dragging break pour alignment, reaction zones, or apparatus constraints
- if necessary, combine free movement with anchor snapping only at the moment chemistry should occur

## Non-movable object rule
Not every mesh must be draggable.
Default the important learner-facing objects to be movable, but leave background furniture, benches, labels, lights, or purely decorative support geometry static unless interaction helps the lesson.

## Geometry discipline
- Do not hard-code free-floating world targets for pours, liquid tops, or labels when an apparatus object can expose anchors.
- For each apparatus, define semantic anchors such as `mouth`, `nozzle`, `pourTarget`, `labelAnchor`, and `effectOrigin`.
- Store apparatus constraints alongside geometry: `innerRadius`, `innerHeight`, `safeFillHeight`, `safePourClearance`, and any tilt limits.
- Derive stream, droplet, smoke, bubble, and highlight positions from those anchors instead of `localToWorld(new Vector3(...))` literals sprinkled through animation code.
- Drive liquid meshes through a small controller/helper that clamps fill level to the vessel interior so fluid does not spill through glass walls.
- Add a lightweight geometry validation pass that warns when nozzle-to-mouth alignment, fill height, or effect origins fall outside the apparatus constraints.
- Follow the repo contract in `docs/apparatus-standard.md` whenever building or refactoring apparatus-driven scenes.
- For active chemistry experiments, use `lib/classic-kit/apparatus.js` as the default module surface and `templates/classic-apparatus-inline-snippet.js` as the self-contained apparatus bundle. Treat `templates/apparatus-scaffold.js` and `lib/apparatus/index.js` as compatibility surfaces for legacy scenes only.
- Prefer `create*Apparatus()` presets plus `createPourInteraction()`, `createDripInteraction()`, `createHeatInteraction()`, or `createSteamInteraction()` instead of scene-local stream/effect logic.
- When the recipe belongs to the active classic path, choose from the classic-kit presets exported by `lib/classic-kit/apparatus.js`: `createClassicTestTubeApparatus`, `createClassicReagentBottleApparatus`, `createClassicSolidReagentJarApparatus`, `createClassicCopperPieceApparatus`, `createZincGranulesApparatus`, `createClassicErlenmeyerApparatus`, `createClassicMoistPaperApparatus`. Do not import legacy names such as `beaker`, `erlenmeyer`, `test-tube`, `dropper`, `alcohol-burner`, `funnel`, `solid-reagent-jar`, or `litmus-paper` — those presets are now in `lib/legacy/apparatus/presets/` and are not part of the active lane. If none of the classic-kit presets fit, file a `recipe-proposal.json` to request a new classic preset; do not fall back to legacy presets in a new scene.
- Prefer chemical appearance presets such as `clearWater()`, `diluteAcid()`, `blueSolution()`, `yellowPrecipitate()`, `denseSteam()`, and `burnerFlame()` over ad-hoc material tuning.
- For apparatus-driven scenes, run the current `createSceneValidatorGate(...).validate()` surface and treat blocker failures as invalid output.
- When generators need preset discovery or shared instantiation metadata, prefer the registry helpers `registerApparatusPreset()`, `getApparatusPreset()`, `listApparatusPresets()`, and `createApparatusFromPreset()` over ad-hoc preset catalogs.
- When the output must stay self-contained and the recipe is on the active classic path, build and inline `templates/classic-apparatus-inline-snippet.js` via `rtk node scripts/build-classic-apparatus-inline-bundle.mjs`. Use `templates/apparatus-inline-snippet.js` only for legacy outputs that still depend on the compatibility apparatus registry.
- Do not regress to the legacy failure mode where LLM invents world-space pour/effect coordinates or duplicates bespoke apparatus helpers inside each HTML.
- Only show visible precipitate solids, yellow streaks, residue clouds, or sediment when that visual is required by the learning objective. If the lesson only needs a solution to change color or become slightly cloudy, prefer that simpler representation.
- When a phenomenon is visually important, actively use the relevant Three.js sub-skills for higher-quality effects instead of settling for a single primitive mesh:
  - `threejs-animation` for state timing and motion fields
  - `threejs-shaders` or textured particles for steam, precipitate, glow, and flame
  - `threejs-materials` for glass/liquid readability
  - `threejs-textures` for soft particle sprites, noise, and gradient masks
- If an apparatus scene is generated from the shared library, the default expectation is:
  - apparatus and anchors from the catalog
  - interactions from the shared primitives
  - visual fidelity layered on top using Three.js effect skills, not by abandoning the apparatus contract

## Visual rules
- Full-screen scene.
- Camera angle should reveal both apparatus and reaction zone.
- Lighting should make the main phenomenon easy to read.
- Effects must match the chemistry, not just look flashy.
- The final state should visibly differ from the initial state.

## Rendering fidelity note (self-contained quality)
When the scene must stay self-contained and reliable in offline/local viewing, keep texture generation procedural and avoid dependencies that require HTTP fetches.

If primitives look “toy-like”, upgrade realism first via materials + procedural textures/shaders, and only then consider heavier external assets.
For flames, food, glass, cold storage, fermentation, residue, smoke, or similar high-visibility cues, prefer better materials, layered geometry, and animated effects over a single symbolic primitive.

## Verification rules
The output is not complete until:
- `node scripts/audit-experiment-scene-contract.mjs <draft-dir>` passes for apparatus-driven experiments
- the module imports work
- the scene visibly renders
- the golden path interaction works
- reset works
- the main chemistry state change is observable
- `ui-ux-tester` has reviewed the page

## Rendering fidelity reminder
When the phenomenon’s look matters (e.g., flames, sparks, smoke), prefer using the 3D visualization + interaction skills to generate more realistic geometry/texture/effects instead of relying on simple single-primitive meshes.

## Reference pattern
Use the sugar + sulfuric acid simulation pattern as a reference for:
- full-screen composition
- drag/drop bottle interaction
- direct object manipulation on scene objects instead of button-first UI
- state text and minimal HUD
- reaction growth and post-reaction residue
- `examples/sugar-h2so4.html` is the preferred interaction style when the learner should physically move apparatus or directly manipulate important scene objects
- if a chemistry lesson can be made clearer by moving the object itself, follow this reference pattern before adding more buttons
