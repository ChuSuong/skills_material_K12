---
name: chem-courseware-orchestrator
description: Orchestrate chemistry courseware generation from a lesson goal. Use this whenever the user wants to generate, plan, choose, or iterate on chemistry interactive learning materials, especially when the right courseware format is not yet obvious. Route to the appropriate chemistry skill, reuse existing Three.js skills, and require verification plus UI/UX review before considering the output complete.
---

# Chemistry courseware orchestrator

Start from the chemistry teaching goal, not from the rendering technology.

## What this skill does
- Read the lesson goal, phenomenon, learner level, and expected interaction.
- Decide which chemistry courseware type fits best.
- Route to an existing chemistry skill when one matches.
- If no chemistry skill fits, first research or pull a reusable skill, then delegate new skill creation to `chem-skill-builder` only when needed.
- Require verification and UI review before calling the output done.

## Supported courseware types
1. **3D experiment simulation**
   - Use `chem-3d-experiment`
   - For lab actions, apparatus, pouring, heating, bubbling, color change, precipitate, smoke, and reaction aftermath
2. **3D chemistry visualization**
   - Use `chem-3d-visualization`
   - For molecules, orbitals, lattices, structure, geometry, and spatial explanation
3. **Process storyboard (step-by-step reaction/process)**
   - Use `chem-process-storyboard`
   - For mechanisms, intermediates, staged transformations, and "step 1 → step 2 → step 3" explanations
4. **New chemistry format not yet covered**
   - Use `chem-skill-builder`
   - Research whether a suitable skill already exists externally or in another local skill base
   - Reuse or adapt that skill when feasible
   - Otherwise create or refine a dedicated chemistry skill, then rerun the request through that skill

## Routing checklist
Before picking a route, extract:
- chemistry topic
- target learner level
- whether the learning objective is conceptual, procedural, observational, or interactive
- whether the experience should be self-contained HTML or tied to a larger runtime
- what the learner must do on screen
- what evidence proves the output works
- whether precise placement, camera framing, or motion quality is critical to learning success

## Phenomenon mapping (avoid dry diagrams)
When the prompt sounds like a graph/table/definition (e.g., rate vs time, amount vs time), **do not default to schematic diagrams**.

Instead:
- Identify the **observable variable over time** (color, mass, bubble rate, temperature, opacity, precipitate amount, diffusion front).
- Choose 1–3 **real specimens/phenomena** that can show different rates clearly (fast/slow) with visible before/during/after states.
- Prefer a **specimen-first stage** where learners watch/interact with the objects as time progresses. If a chart is useful, keep it as a small secondary HUD, not the main stage.
- For rate/time prompts, default to **3D experiment simulation** (`chem-3d-experiment`) unless the user explicitly asks for a graph-first lesson.

## Missing-skill loop
When no existing chemistry skill fits:
- search the local chemistry and imported Three.js skill set first
- research whether a reusable external skill or pattern already exists
- pull/adapt when the fit is good enough and cheaper than creating a new skill
- create a new chemistry skill only when reuse would be forced or low quality
- after creating or adapting a skill, rerun the original lesson request through the new route

## Default output mode
Prefer a **direct-openable self-contained HTML** output for the first implementation unless the user explicitly needs deeper integration into an existing runtime.

Default expectation:
- the learner can open the HTML directly in a browser via `file://`
- the experience still works when served over a local HTTP server for verification
- local server use is a verification/dev path, not a runtime requirement for the learner
- do not make the generated HTML depend on repo-local module imports or filesystem paths that fail under direct browser open
- if shared code is needed, inline/bundle it into the output or use browser-resolvable URLs

## Language rules
Default to **Vietnamese** for learner-facing writing unless the user explicitly requests another language.

This includes:
- titles and headings shown to learners
- status text and hint text
- button labels when reasonable
- short explanatory copy returned with the output

Keep chemistry terminology precise, natural, and easy to read for Vietnamese learners.

## Common output contract
All generated chemistry courseware should follow these defaults unless the user explicitly requests otherwise:
- output a direct-openable self-contained HTML experience
- keep the scene or learning stage visually dominant
- prefer a full-screen layout with no accidental page scroll
- include a visible learner status area
- include one primary learner action
- keep the camera stable by default; avoid auto-follow camera motion unless the user or learning objective explicitly requires it
- for direct-manipulation scenes, still allow normal learner camera orbit/zoom when not dragging an object; disable camera controls only during active object drag when needed
- default to object-first interaction whenever feasible: learners can pick up, hold, drag/drop freely, and place the important scene objects directly in 3D
- allow free drag/drop for learner-manipulable objects unless the chemistry requires constraints or exact placement rules
- when it helps the lesson and remains readable/testable, allow objects to be thrown/tossed via release velocity instead of always snapping back
- make the primary action happen on the scene objects themselves whenever the learner can reasonably grab, drag, open, tilt, place, touch, or toss something in 3D
- keep autoplay and button-triggered narration as secondary guidance paths, not the main interaction, unless the user explicitly asks for button-first behavior
- include a reset path back to a ready state
- make the chemistry legible through before/during/after state differences
- if free drag/drop/throw is enabled, still preserve a deterministic golden path for Playwright interaction checks
- avoid chaotic physics that obscures the chemistry or makes the lesson feel like a toy

## Interaction priority note
If the user requests free manipulation (grab/drag/drop/throw):
- route to `chem-3d-experiment` unless another skill is a clearly better fit
- prioritize scene-object interaction over panel controls
- keep one obvious primary object to manipulate
- keep reset strong and deterministic
- keep the chemistry change observable and reliably triggerable

## Non-interactive objects
Not every mesh must be movable.
Default the important learner-facing objects to be movable, but leave background decor static unless interaction directly supports the learning goal.

## Default UI contract
Prefer these selectors when generating the first pass so test and review steps can interact reliably:
- `#statusText` for the main learner-facing state
- `#statusSub` for supporting state or hint text
- `#pourBtn` or `[data-action="autoplay"]` for the primary action
- `#resetBtn` or `[data-action="reset"]` for reset

## Reuse rules
When the chosen path is 3D:
- use `threejs-fundamentals` for scene, camera, lighting, and renderer setup
- use `threejs-interaction` for grabbing, holding, drag/drop, release, click, pointer, controls, and interaction flow
- when the lesson benefits from it and readability stays strong, allow release velocity to create short throw/toss behavior instead of forcing immediate snap-back
- use `threejs-animation` for reaction motion, transitions, particles, growth, and stateful visual effects
- default to direct scene interaction for apparatus, tools, containers, doors, lids, specimens, or household objects instead of relying on panel buttons to drive the chemistry
- for life-application scenes, prefer meaningful object manipulation such as moving a torch, opening a fridge door, touching or rotating a jar, placing an item into position, or briefly tossing a suitable object so the learner causes the observable change in the scene
- if free movement is enabled, keep one deterministic golden path for Playwright and preserve a stable reset path back to the ready state
- do not allow free manipulation or throw/toss behavior to break apparatus alignment, reaction anchors, or chemistry legibility
- for apparatus-driven scenes, require the output to follow `docs/apparatus-standard.md`
- for apparatus-driven scenes, require anchor-based geometry and validation instead of free-floating physics targets
- if a common labware/tool is missing, prefer adding a reusable preset module under `lib/apparatus/presets/*.js` and exposing it through `lib/apparatus/presets.js` before patching scene-local world-space coordinates
- when a 3D chemistry scene repeats generic helpers, prefer reusing `lib/interaction/direct-manipulation.js`, `lib/runtime/timeline.js`, and `lib/testing/harness.js` instead of copying scene-local pointer, timeline, or Playwright harness utilities into each HTML
- keep those shared helpers thin and scene-agnostic: extract only proven repeated patterns, not a large framework

When visual fidelity matters (flame/smoke/sparks/glow/photons, subtle gradients):
- prefer `threejs-shaders` + `threejs-textures` for procedural look and believable motion
- consider `threejs-postprocessing` for mild bloom/glow (avoid heavy cinematic grading)

When scene realism/readability matters:
- route to `chem-3d-experiment` unless another chemistry skill is a clearly better fit
- use `threejs-materials` + `threejs-lighting` to keep apparatus and reaction zone legible
- use `threejs-geometry` for better-shaped apparatus/effects when primitives look too toy-like
- use `threejs-shaders` + `threejs-textures` when flame, smoke, glow, condensation, bubbles, or subtle surface variation are important to the learning goal
- use `threejs-loaders` only when importing external models/assets is justified

Do not copy large Three.js references into the output prompt. Reuse the existing skills deliberately.

## Verification requirements
Before reporting completion:
- run Playwright verification first
- require the output to pass format, render, and interaction checks before any review step
- after Playwright passes, call sub-agent `verification-reviewer`
- after Playwright passes, call sub-agent `ui-ux-tester`
- if Playwright fails, do not call review sub-agents yet; loop back and fix the output first
- if `verification-reviewer` or `ui-ux-tester` reports issues, loop back, fix the output, and run Playwright again before re-review

## Playwright verification order
Run these checks against the generated HTML output:
- `npm run test:format` with `COURSEWARE_HTML` pointing to the generated file
- `node scripts/pw-smoke-open-html.mjs <html-path>`
- `node scripts/pw-assert-canvas-visible.mjs <html-path>`
- `node scripts/pw-interaction-golden-path.mjs <html-path>`

The output should not be considered review-ready until these checks pass.

## Output expectations
Return or generate:
- the chosen chemistry courseware type
- the output path
- a short note on why this format matches the chemistry lesson
- whether the result came from local reuse, external adaptation, or new skill creation
- the verification evidence or next verification step
