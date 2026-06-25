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

## Visual theme (standard)
Match the established look across all generated courseware — do not invent new colors/fonts:
- Page: `color-scheme: dark`; body background `radial-gradient(circle at top, #1f2a44 0%, #0b1220 48%, #05070d 100%)`; font `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Accent color: `#67d8ff` (titles, key labels, highlights). Warm/hint color: `#ffce6b` (hints, warnings, secondary callouts).
- HUD panels: `border-radius: 18px`; background `rgba(12, 18, 32, 0.74)` (or `rgba(10, 14, 26, 0.72)` for secondary panels); border `1px solid rgba(255, 255, 255, 0.12)`; `box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35)`; `backdrop-filter: blur(18px)` on the primary panel, `blur(16px)`/`blur(12px)` on secondary/tertiary panels.
- Panel placement: primary panel `top: 24px; left: 24px`; secondary panel `top: 24px; right: 24px`. Keep HUD corners only — center stage stays clear for the 3D/canvas content.
- Panel typography: title `font-size: 18px; line-height: 1.18; letter-spacing: -0.02em` in accent color; body text `font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.82)`.
- Reference implementation: `examples/sugar-h2so4.html` and any file under `generated/` — copy the existing `:root` tokens and panel CSS rather than rewriting them from scratch.
- Start from `examples/visual-theme-template.html` for the page shell and HUD — copy it, then add the 3D scene via `threejs-fundamentals` rather than writing the CSS/HUD markup from scratch.

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
