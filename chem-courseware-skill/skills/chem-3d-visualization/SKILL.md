---
name: chem-3d-visualization
description: Build chemistry-focused 3D visual explanations for molecules, atoms, bonding, orbitals, crystal structures, spatial geometry, and reaction geometry. Use this whenever the user needs a chemistry concept explained through 3D viewing, animation, labeling, or controlled interaction rather than a lab-style apparatus simulation.
---

# Chemistry 3D visualization

Default to a 3D interactive scene where the learner manipulates or inspects the subject directly on the rendered view.

## Use this skill for
- molecular geometry
- bond angles and shape comparison
- crystal or lattice structure
- electron cloud or orbital storytelling
- structure-driven chemistry explanations

## Reuse existing skills
- use `threejs-fundamentals` for scene structure and rendering
- use `threejs-interaction` for rotate, inspect, hover, click, and focus behavior
- use `threejs-animation` for transitions, highlighting, morphing, and staged reveals
- use `threejs-materials` + `threejs-lighting` to keep atoms/bonds/labels readable and depth cues clear
- use `threejs-geometry` when building custom meshes (orbitals, electron clouds, lattices, polyhedra) is clearer than loading assets
- use `threejs-shaders` for orbital/electron-cloud style rendering, rim highlights, and procedural emphasis effects
- use `threejs-textures` for label sprites/canvas textures and simple gradient maps
- use `threejs-postprocessing` sparingly (subtle bloom/FXAA) when it helps legibility
- use `threejs-loaders` only when importing prepared molecular/mesh assets is necessary

## Build checklist
- Identify the exact chemistry concept that benefits from 3D.
- Decide what the learner should inspect or compare.
- If a concept can be learned through object handling, prefer direct touch/drag/rotate interaction on the 3D object instead of panel-driven controls.
- Use labels sparingly and keep them tied to the concept.
- Prefer a clean visual stage over decorative UI.
- Keep HUD minimal so it does not compete with the 3D subject.
- Provide a default camera pose that immediately teaches something useful.

## Output expectations
- self-contained HTML unless the user needs another integration target
- clear concept framing
- a visible interaction path such as rotate, select, highlight, compare, animate, or direct manipulation of the object itself
- minimal HUD and sparse text so the 3D subject stays dominant
- a final view that reinforces the concept

## Verification rules
- model or scene renders correctly
- controls behave predictably
- labels and highlights remain readable
- there is no visual clutter that competes with the chemistry concept
- `ui-ux-tester` reviews the experience before completion
