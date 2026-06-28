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

## Architecture conventions

- **Skill boundary:** This orchestrator decides the courseware route and verification gates. It must not duplicate detailed 3D apparatus, interaction, effect, or reaction rules; those belong in `chem-3d-experiment`.
- **Compiler-first pipeline:** Prefer producing a semantic draft and assembling through `scripts/compile-semantic-draft.mjs` + `scripts/assemble-courseware.mjs` before hand-writing standalone HTML. See `docs/semantic-draft-contract.md` and `docs/generated-artifact-contract.md`.
- **Recipe-builder first experiments:** For common 3D experiments, choose an existing `recipes/*.recipe.json` before writing scene code. If `scripts/build-recipe-scene.mjs` supports the recipe, generate only `semantic-draft.json` and run `rtk node scripts/compile-semantic-draft.mjs <draft-dir>/semantic-draft.json`; do not hand-write `<slug>.scene.js`.
- **Proposal-first unsupported experiments:** If a lesson maps to a known chemistry pattern but no supported recipe builder exists, create `recipe-proposal.json` from `recipes/pattern-catalog.json` instead of generating HTML. See `docs/recipe-proposal-workflow.md`.
- **3D implementation contract:** After routing to `chem-3d-experiment`, follow that skill's apparatus, recipe, interaction, effect, and reaction hard gates. Do not restate or override them here.

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

## New 3D experiment request flow
For `chem-3d-experiment` requests:
- First check whether the request maps to a recipe supported by `scripts/build-recipe-scene.mjs`.
- If supported, create `semantic-draft.json`, compile, assemble, and verify.
- If a recipe exists but is not builder-supported, stop before HTML and create a `recipe-proposal.json` or builder backlog item.
- If no recipe exists but the request matches a pattern in `recipes/pattern-catalog.json`, generate `recipe-proposal.json` using `scripts/propose-recipe-from-pattern.mjs`, then validate with `scripts/validate-recipe-proposal.mjs`.
- Do not hand-write `<slug>.scene.js` for unsupported or missing recipes.

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
- keep the learning stage visually dominant
- prefer a full-screen layout with no accidental page scroll
- include a visible learner status area
- include one primary learner action
- include a reset path back to a ready state
- make the chemistry legible through before/during/after state differences
- preserve a deterministic verification path for the chosen format

## Reuse rules
When the chosen path is 3D:
- route to `chem-3d-experiment`
- use the local Three.js skills only as supporting references after `chem-3d-experiment` defines the contract
- do not copy detailed apparatus, interaction, effect, reaction, label, or verifier rules into this orchestrator

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
- `node scripts/audit-experiment-scene-contract.mjs <draft-dir>` for apparatus-driven experiments
- `node scripts/audit-recipe-scene-contract.mjs <draft-dir>` when `semantic-draft.json.recipe` is set
- `npm run verify:pw:contract` for recipe-builder generated HTML
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
