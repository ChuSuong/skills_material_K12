---
name: chem-skill-builder
description: Create or refine a new chemistry courseware skill when the current chemistry skill set does not cover the requested learning-material format. Use this when the orchestrator identifies a chemistry use case that does not cleanly fit the existing chemistry skills.
---

# Chemistry skill builder

Use `skill-creator` to expand the chemistry skill system without bloating the existing skills.

## When to use this skill
- the requested chemistry courseware format does not fit `chem-3d-experiment`
- the requested chemistry courseware format does not fit `chem-3d-visualization`
- repeated prompts show a new chemistry pattern worth codifying
- the team needs a reusable chemistry skill instead of another one-off output

## Workflow
1. Define the new chemistry format in learner terms.
2. Explain why existing chemistry skills are insufficient.
3. Check whether an external or adjacent reusable skill can be pulled and adapted faster than writing a new one.
4. Use `skill-creator` to draft a new chemistry skill only if reuse is insufficient.
5. Add realistic chemistry eval prompts.
6. Add verification expectations and UI review requirements.
7. Require review for scene composition, coordinate placement, and motion smoothness when the format is spatial or animated.
8. Run with-skill versus baseline comparisons when useful.
9. Feed the resulting skill back into the chemistry skill set.

## Boundaries
- Optimize first for chemistry quality.
- Keep the new skill narrow enough to trigger reliably.
- Reuse existing Three.js and review skills instead of duplicating their content.
- Do not over-generalize for other subjects in the first pass.

## Required outputs
- new skill name
- trigger description
- expected output format
- reuse decision: local reuse, external adaptation, or new build
- test prompts
- verification checklist
