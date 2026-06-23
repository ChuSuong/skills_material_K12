# Chem Courseware Skill Base

Bootstrap repository for an agent-driven chemistry courseware system.

## Purpose

This repo is organized around one core idea:

- Input: a chemistry lesson goal or lesson content
- Agent decides the right interactive courseware format
- Agent reuses an existing courseware skill when possible
- If no skill fits, agent researches, pulls, or builds a new skill
- Agent generates the courseware output
- Specialized reviewers verify render quality, interaction quality, chemistry clarity, and visual polish

The long-term goal is not to handcraft one fixed type of learning material, but to keep expanding a reusable skill base for many chemistry courseware formats.

## Current architecture

### Skill routing

- `.claude/skills/chem-courseware-orchestrator/`
  Routes a lesson request to the best chemistry courseware format.
- `.claude/skills/chem-skill-builder/`
  Creates or refines a new chemistry skill when the format does not exist yet.
- `.claude/skills/chem-3d-experiment/`
  For apparatus-driven, interactive experiment simulations.
- `.claude/skills/chem-3d-visualization/`
  For spatial chemistry explanations such as molecules and structure.
- `.claude/skills/chem-process-storyboard/`
  For step-by-step process or mechanism teaching.

### Reusable rendering skills

- `skills/threejs-*`
  Imported Three.js skills used as low-level capability modules for scene setup, interaction, animation, materials, textures, lighting, shaders, loaders, and post-processing.

### Reviewer / evaluator prompts

- `agents/grader.md`
  Grades benchmark assertions.
- `agents/verification-reviewer.md`
  Reviews render success, golden path, and chemistry clarity.
- `agents/ui-ux-tester.md`
  Reviews spatial layout, visual hierarchy, learner affordance, smoothness, and overall polish.

### Runtime and verification

- `templates/`
  Base templates and lightweight references.
- `scripts/`
  Playwright-based verification utilities for local HTML outputs.
- `generated/`
  On-demand output workspace for generated outputs and verification artifacts. Create it when a run needs to save artifacts.
- `evals/`
  Eval prompts for orchestration behavior.

## Expected agent flow

1. Read the lesson input and extract topic, level, learning objective, learner action, and success evidence.
2. Classify the best courseware format.
3. Check whether a matching skill already exists locally.
4. If yes, generate with that skill and reuse the `threejs-*` capability skills when needed.
5. If not, research reusable skills first, then pull/adapt one if suitable; otherwise create a new local chemistry skill.
6. Generate the first output, ideally as a self-contained HTML file.
7. Create `generated/<kind>/<slug>/` on demand and save the output HTML plus `metadata.json`.
8. Run Playwright verification for render, visible canvas, and interaction golden path.
9. Save screenshots or other verification evidence alongside the generated output or under `generated/verify/` when the artifact is standalone evidence.
10. Run reviewer agents for chemistry clarity and UI/UX polish.
11. If the reviewers find issues, loop back and refine the skill and/or output.

## Important current gaps

- No explicit skill registry yet for "what exists locally" versus "what should be researched externally".
- No dedicated orchestration artifact yet for planner -> router -> builder -> reviewer state handoff.
- No automated sub-agent wiring yet in repo code; current repo mainly stores prompts, skills, templates, and verification scripts.
- No dedicated reviewer yet for coordinate accuracy, object placement discipline, motion smoothness, and scene composition quality beyond the new prompt scaffolding.

## Recommended next build steps

1. Add a skill registry file describing each courseware skill, trigger conditions, dependencies, and verification requirements.
2. Add an orchestration state schema for lesson analysis, route choice, missing-capability detection, and review results.
3. Add a research/pull workflow for adopting existing skills before generating a brand-new one.
4. Add a multi-agent runner that explicitly calls planner, builder, verifier, chemistry reviewer, and UI/UX reviewer.
5. Add visual regression checks for scene framing and key reaction visibility, not only render-success checks.
