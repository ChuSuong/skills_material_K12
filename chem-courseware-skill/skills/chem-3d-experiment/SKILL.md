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
- The learner should be able to open the HTML directly in a browser via `file://`.
- The same HTML should also work when served over local HTTP for verification.
- Do not rely on repo-local module imports or filesystem paths that break when the file is opened directly.
- If shared code is needed, inline/bundle it into the HTML or use browser-resolvable URLs.
Prefer direct interaction on the rendered scene itself over panel-driven UI.
If the learner can plausibly manipulate an object in the scene, make that manipulation the default primary interaction.
Default to object-first interaction: learners should be able to pick up, hold, move, and drag/drop the important scene objects directly whenever that fits the lesson.
Allow free drag/drop and release for learner-manipulable objects unless the chemistry requires a constrained path or placement rule.
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
Prefer plain text labels inside the 3D scene.
- Do not generate boxed callout cards, framed sprites, or floating HUD panels above objects unless the user explicitly asks for that style.
- If the scene needs labels above apparatus or clusters, render text-only labels with a subtle shadow/glow for readability.
- Keep in-scene labels visually light so they do not compete with the chemistry interaction.

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
- Reuse `templates/apparatus-scaffold.js` as the browser-friendly entry for apparatus scenes; use the `lib/apparatus/index.js` barrel as the canonical module surface when you are working in module-based code.
- Prefer `create*Apparatus()` presets plus `createPourInteraction()`, `createDripInteraction()`, `createHeatInteraction()`, or `createSteamInteraction()` instead of scene-local stream/effect logic.
- When the repo already has a matching preset family such as beaker, bottle, `reagent-bottle`, erlenmeyer, `test-tube`, dropper, `alcohol-burner`, funnel, `solid-reagent-jar`, or `litmus-paper`, reuse that preset and its semantic anchors before inventing scene-local apparatus geometry.
- Prefer chemical appearance presets such as `clearWater()`, `diluteAcid()`, `blueSolution()`, `yellowPrecipitate()`, `denseSteam()`, and `burnerFlame()` over ad-hoc material tuning.
- For apparatus-driven scenes, run the current `createSceneValidatorGate(...).validate()` surface and treat blocker failures as invalid output.
- When generators need preset discovery or shared instantiation metadata, prefer the registry helpers `registerApparatusPreset()`, `getApparatusPreset()`, `listApparatusPresets()`, and `createApparatusFromPreset()` over ad-hoc preset catalogs.
- When the output must stay self-contained, build and inline `templates/apparatus-inline-snippet.js` via `rtk node scripts/build-apparatus-inline-bundle.mjs`.
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
