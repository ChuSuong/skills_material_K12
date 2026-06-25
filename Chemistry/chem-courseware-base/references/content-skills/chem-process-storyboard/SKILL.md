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
