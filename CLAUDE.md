# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This repository currently has two main active areas:

- `chem-courseware-skill/`: the chemistry courseware skill package. This is the most operationally complete part of the repo and contains the reusable skill prompts, shared apparatus/runtime libraries, templates, Playwright verification scripts, and node tests.
- `src/modules/gen_material/`: a separate 3D material generation app with a FastAPI backend and a React frontend (`demo_3d_viewer`). Use this area only when the task is about the 3D generation pipeline or viewer app rather than chemistry courseware output.

The root `README.md` is minimal; most actionable project guidance lives under `chem-courseware-skill/README.md` and `src/modules/gen_material/README.md`.

## Common commands

### Chemistry courseware skill package

Run these from `chem-courseware-skill/`.

Install dependencies:

```bash
npm install
```

Run the standard verification suite against a generated or example HTML:

```bash
COURSEWARE_HTML=/abs/path/to/courseware.html npm run verify
```

Run individual Playwright checks:

```bash
COURSEWARE_HTML=/abs/path/to/courseware.html npm run verify:pw:smoke
COURSEWARE_HTML=/abs/path/to/courseware.html npm run verify:pw:canvas
COURSEWARE_HTML=/abs/path/to/courseware.html npm run verify:pw:interaction
npm run verify:pw:screenshot
```

Run node tests:

```bash
npm run test:apparatus
npm run test:format
COURSEWARE_HTML=/abs/path/to/courseware.html npm run test:format
```

Run a single node test file directly:

```bash
node --test tests/apparatus-contract-registry.test.mjs
node --test tests/apparatus-public-surface.test.mjs
node --test tests/courseware-format.test.mjs
```

Rebuild the inline apparatus bundle used by self-contained outputs:

```bash
node scripts/build-apparatus-inline-bundle.mjs
```

### 3D material generation app

Backend setup and run, from `src/modules/gen_material/backend/`:

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
cp .env.example .env
uv run python -m uvicorn main:app --host 0.0.0.0 --port 8006
```

Frontend setup and run, from `src/modules/gen_material/demo_3d_viewer/`:

```bash
npm install
npm start
PORT=3002 npm start
npm run build
npm test
```

The React app proxies API traffic to `http://127.0.0.1:8006`.

## High-level architecture

### Chemistry courseware system

The chemistry package is organized around an agent-driven generation pipeline rather than a single application runtime.

- Skill routing starts in `chem-courseware-skill/skills/chem-courseware-orchestrator/SKILL.md`.
- The orchestrator routes lesson requests into one of the domain skills:
  - `chem-3d-experiment`
  - `chem-3d-visualization`
  - `chem-process-storyboard`
  - `chem-skill-builder` when no local format fits
- Imported `threejs-*` skills provide low-level scene capabilities such as fundamentals, interaction, animation, materials, textures, shaders, lighting, loaders, and postprocessing.

The intended output path is usually a direct-openable, self-contained HTML file that works both via `file://` and when served over local HTTP for verification.

### Verification flow for chemistry outputs

The chemistry package treats verification as part of the generation contract.

- `tests/courseware-format.test.mjs` checks the HTML-level output contract: full-screen canvas, no accidental scroll, required UI selectors (`#statusText`, `#statusSub`, primary action, reset), non-overlapping overlays, and a visible learner-state change after interaction.
- `scripts/pw-smoke-open-html.mjs`, `scripts/pw-assert-canvas-visible.mjs`, and `scripts/pw-interaction-golden-path.mjs` are the Playwright checks used by `npm run verify`.
- Reviewer prompts live separately from code; the README describes `verification-reviewer` and `ui-ux-tester` as post-verification review steps.

When editing generation logic or output expectations, keep the format test and Playwright scripts aligned with the UI contract.

### Shared apparatus library

Apparatus-heavy chemistry scenes should be built around the shared library under `chem-courseware-skill/lib/apparatus/`, not by inventing scene-local world-space geometry.

The public surface is exported from:

- `chem-courseware-skill/lib/apparatus/index.js`
- `chem-courseware-skill/lib/apparatus/core.js`
- `chem-courseware-skill/lib/apparatus/presets.js`
- `chem-courseware-skill/lib/apparatus/interactions.js`
- `chem-courseware-skill/lib/apparatus/chemicals.js`
- `chem-courseware-skill/lib/apparatus/contract.js`
- `chem-courseware-skill/lib/apparatus/capabilities.js`
- `chem-courseware-skill/lib/apparatus/registry.js`

This layer separates:

- apparatus geometry and semantic anchors
- reusable interaction primitives like pour/drip/heat/steam
- chemical appearance presets
- contract/registry metadata for discovering apparatus by capabilities
- validation gates that reject bad apparatus alignment or impossible scene setups

The key design rule from `chem-courseware-skill/docs/apparatus-standard.md` is that physics-bound positions such as `mouth`, `nozzle`, `pourTarget`, `effectOrigin`, and liquid bounds must come from apparatus anchors and constraints, not ad hoc `Vector3(...)` guesses scattered in scene code.

### Templates and self-contained output strategy

- `chem-courseware-skill/templates/apparatus-scaffold.js` is the browser-friendly apparatus entrypoint.
- `chem-courseware-skill/templates/apparatus-inline-snippet.js` is the generated inline bundle used when the output must remain self-contained.
- `chem-courseware-skill/scripts/build-apparatus-inline-bundle.mjs` rebuilds that inline snippet by concatenating and stripping module syntax from the public apparatus modules.

If a task changes the apparatus public API, update the bundle and keep the public-surface tests passing.

### Shared non-apparatus helpers

These are thin reusable helpers that chemistry scenes are expected to share instead of copying scene-local logic repeatedly:

- `chem-courseware-skill/lib/interaction/direct-manipulation.js`
- `chem-courseware-skill/lib/runtime/timeline.js`
- `chem-courseware-skill/lib/testing/harness.js`

Use them when a scene needs pointer normalization, drag-plane logic, OrbitControls gating, common timeline math, or Playwright-facing hooks.

### 3D material generation app

`src/modules/gen_material/` is a separate system from the chemistry skill package.

- `backend/` is a FastAPI service that can run in a lighter baseline mode or a GPU/TRELLIS-backed mode depending on local environment setup.
- `demo_3d_viewer/` is a Create React App frontend that talks to the backend over the configured proxy.
- The backend also relies on `src/modules/gen_img` for RealESRGAN enhancement and expects large model weights and TRELLIS sources to be provisioned outside the repo.

When working here, treat external model paths, `.env`, and GPU/TRELLIS setup as machine-specific dependencies rather than repo-local guarantees.

## Working conventions that matter in this repo

- For chemistry courseware work, prefer editing or extending shared apparatus presets and shared helpers before patching one-off scene-local geometry.
- Preserve the learner-facing UI contract used by the verification tests unless the task explicitly changes it.
- For apparatus-driven scenes, follow `chem-courseware-skill/docs/apparatus-standard.md` and keep validation in the loop.
- Generated outputs and verification artifacts belong under `chem-courseware-skill/generated/` when a task needs to save them.
- `chem-courseware-skill/node_modules/` is currently present in the working tree; avoid treating vendored dependency files as project source unless the task is explicitly about dependencies.
