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
- simulations where user actions trigger a chemical change

## Default implementation style
Build as a **single self-contained 3D HTML experience** that runs locally.
Prefer direct interaction on the rendered scene itself over panel-driven UI.

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

## Effect library reuse
Build liquids, smoke/steam, and porous/charred masses using `chem-courseware-base`'s effect
helpers instead of hand-writing inline shaders or canvas gradients per lesson:
- pour streams / flowing liquids → `chem-courseware-base/effects/liquid-shader.mjs`
- smoke/steam puffs and bubble glow sprites → `chem-courseware-base/effects/organic-texture.mjs`
- char/rock/porous surface bumpiness → `chem-courseware-base/effects/jitter-geometry.mjs`
- particle fade-out near end of life → `chem-courseware-base/effects/particle-pop.mjs`

A fix to one of these helpers should improve every lesson built after it, instead of drifting
per-file the way the visual theme already has.

## Chemistry-specific build checklist
- Identify the apparatus and materials.
- Define the learner action.
- Prefer direct manipulation of 3D objects in the scene: grab, drag, tilt, pour, place, or touch the apparatus itself.
- Use buttons only for secondary actions such as reset, not as the main chemistry interaction.
- Define what visual changes prove the chemistry happened.
- Separate the experience into states: ready, active manipulation, reaction, aftermath.
- Keep the experiment area dominant on screen.
- Keep HUD minimal and directly tied to the chemistry.
- Include reset and at least one guided action path.

## Visual rules
- Full-screen scene.
- Camera angle should reveal both apparatus and reaction zone.
- Lighting should make the main phenomenon easy to read.
- Effects must match the chemistry, not just look flashy.
- The final state should visibly differ from the initial state.

## Rendering fidelity note (self-contained quality)
When the scene must stay self-contained and reliable in offline/local viewing, keep texture generation procedural and avoid dependencies that require HTTP fetches.

If primitives look “toy-like”, upgrade realism first via materials + procedural textures/shaders, and only then consider heavier external assets.

## Verification rules
The output is not complete until:
- the module imports work
- the scene visibly renders
- the golden path interaction works
- reset works
- the main chemistry state change is observable
- any automatic rest/trigger position satisfies its own activation-condition function (e.g. an
  `isXAboveY()`-style check) — verified by running
  `chem-courseware-base/scripts/pw-capture-checkpoints.mjs` and reviewing the result against
  `chem-courseware-base/references/visibility-checklist.md`
- transparent container contents (glass beakers/bottles/vessels) stay legible against the chosen
  background — confirmed via the same 3-checkpoint screenshots
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
- `examples/sugar-h2so4.html` is the preferred interaction style when the learner should physically move apparatus
