---
name: chem-process-storyboard
description: Create chemistry process storyboards that explain a reaction or mechanism as a clear sequence of steps (states) with simple animations and learner-controlled progression. Use this when the learning goal is understanding a multi-step process, reaction mechanism, or staged transformation rather than manipulating lab apparatus or inspecting a static 3D structure.
---

# Chemistry process storyboard

Use this skill when the chemistry is best taught as a sequence of discrete steps.

## Use this skill for
- reaction mechanism storytelling (initiation/propagation/termination)
- multi-step transformations with intermediates
- process explanations that need "step 1 → step 2 → step 3" progression
- staged observations where learners should focus on one change at a time

## Output expectations
- default to a single self-contained HTML file
- clear step list and step titles in learner language
- a learner-controlled progression (Next/Prev, scrubber, or step selector)
- each step has a visible, meaningful state change
- minimal HUD: only what is needed to navigate steps and understand the process

## Reuse existing skills
- use `threejs-fundamentals` for scene, camera, lighting, renderer setup
- use `threejs-animation` for step transitions and state changes
- use `threejs-interaction` only if the storyboard needs direct manipulation beyond step navigation
- use `threejs-materials` + `threejs-textures` to keep each step visually distinct and readable without clutter
- use `threejs-shaders` when a step needs a clean procedural effect (dissolve, diffusion, glow front) rather than heavy assets
- use `threejs-postprocessing` sparingly (e.g., mild bloom on reactive/excited regions)
- use `threejs-geometry` when steps need custom shapes (apparatus cross-sections, flow arrows as 3D ribbons)
- use `threejs-loaders` only when a storyboard step relies on external models (GLTF)

## Verification rules
The output is not complete until:
- each step renders and transitions without errors
- the learner can complete the full step sequence (golden path)
- the final step clearly differs from the initial step
- `ui-ux-tester` has reviewed the experience
