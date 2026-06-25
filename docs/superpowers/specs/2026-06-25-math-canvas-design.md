# Math Canvas — Design Spec

Date: 2026-06-25
Status: Approved (architecture-level; per-mode implementation specs/plans follow separately)

## 1. Purpose

Extend the existing `geometry-canvas` skill into a broader interactive math
workspace (`math-canvas`), similar in spirit to GeoGebra: one canvas, several
content modes, all sharing the same coordinate engine and visual language
(Desmos-style: white background, light grid, black arrowed axes, Helvetica
Neue, fixed color palette).

Output remains widget-only via `show_widget` — no files are created for the
generated lesson asset itself.

## 2. Scope

In scope (this spec, architecture level):
- Renaming `geometry-canvas` → `math-canvas`
- Mode switcher in the toolbar: Geometry, Graphing, Vector, Statistics
- Shared engine: coordinate transforms, pan/zoom, color palette, `pill()`
  helper, point-based object model
- Per-mode state isolation rules (switching modes never destroys other
  modes' state)
- Error-handling conventions shared across modes

Out of scope (deferred to per-mode specs/plans, built in order after this
spec is approved):
1. Geometry mode upgrade (angle tool, midpoint/perpendicular-bisector as
   real tools instead of code snippets)
2. Graphing mode (function plotting with custom expression parser)
3. Vector mode (vectors + translate/reflect/rotate/dilate transforms)
4. Statistics mode (histogram/bar chart from comma-separated input)

Each of the four items above gets its own design pass through
`writing-plans` before implementation, using this spec as the architectural
contract they must fit into.

## 3. Architecture

### 3.1 Unified state, mode-aware rendering

A single global state object holds data for *all* modes simultaneously:

```javascript
let mode = 'geometry'; // 'geometry' | 'graphing' | 'vector' | 'statistics'

// Geometry (existing, unchanged data shapes)
let pts = [], segs = [], circs = [], polys = [];
let angles = []; // new: [{v: ptId, a: ptId, b: ptId}]

// Vector mode
let vecs = [];       // [{from: ptId, to: ptId, color}]
let transforms = []; // record of applied translate/reflect/rotate/dilate ops

// Graphing mode
let funcs = []; // [{expr: string, ast, color}]

// Statistics mode
let dataset = []; // number[]
```

Rationale: the four modes share one coordinate plane, and objects created in
one mode are useful as inputs in another (e.g. a Geometry-mode point used as
a vector endpoint, or as the center of a rotation). A single shared
object space keeps that natural; per-mode sub-apps would require explicit
bridging code to achieve the same thing.

Switching `mode` only changes (a) which toolbar buttons are shown, and (b)
which `drawXxx()` branches run inside `redraw()`. It never clears another
mode's arrays. `clearAll()` remains an explicit, separate action.

### 3.2 Shared engine (unchanged from geometry-canvas)

- Coordinate transforms: `gsx/gsy/gmx/gmy`, pan via drag, zoom via wheel/pinch
  toward cursor (`pX`, `pY`, `Z`)
- Visual constants: `DCOLS` palette, `HF` font stack, grid color `#e8e8e8`,
  axis color `#222`
- `pill(txt, x, y, col)` measurement label helper
- Point-based object model: every higher-order object (segment, circle,
  polygon, vector, angle) stores point **IDs**, never coordinates directly,
  so dragging a point reshapes everything that references it

### 3.3 Render loop

```javascript
function redraw() {
  drawBg(); drawGrid();
  if (mode === 'geometry')   drawPolys(), drawCircs(), drawSegs(), drawAngles();
  if (mode === 'graphing')   drawFuncs();
  if (mode === 'vector')     drawVecs();
  if (mode === 'statistics') drawChart();
  drawPrev(); drawPts(); // shared: pending-tool preview + point markers
}
```

Points (`pts`) are drawn in every mode where they're relevant (Geometry,
Vector use them as anchors); Graphing and Statistics modes don't render
`pts` since they have no use for free points.

### 3.4 Toolbar

Mode switcher is a button group at the left of the toolbar (`Geometry |
Graphing | Vector | Statistics`). The rest of the toolbar swaps its buttons
based on `mode`, following the same `setT(tool)` pattern already used for
tool selection within Geometry mode. `loadEx()` becomes mode-aware — each
mode gets its own example loader, invoked based on current `mode`.

## 4. Error handling conventions (apply to all modes)

- Invalid input never throws or crashes the canvas: catch at the parse
  boundary, report via the status bar (`#dst`) in red/warning style, and
  skip the invalid piece while keeping previously valid state intact.
- Math domain errors (e.g. `sqrt(-1)`, division by zero at a sample point)
  produce `NaN`/`Infinity` — the draw function checks and skips that point
  rather than propagating the error.
- Incomplete multi-step tool interactions (e.g. Rotate without an angle
  entered yet) keep `pend[]` as-is and prompt the next required input via
  the status bar, rather than creating a malformed object.
- Existing canvas-state-discipline rules from `geometry-canvas` continue to
  apply: always hex literals (never CSS vars) inside canvas drawing code,
  always `save()`/`restore()` around `globalAlpha`/`setLineDash`/`lineJoin`
  changes, always set `font` before calling `measureText()`.

## 5. Testing / verification approach

No automated test runner applies to a self-contained `show_widget` HTML/JS
asset. Verification is manual, via rendering the widget and exercising each
mode's tools by hand. The skill's documentation will include a per-mode
manual checklist (e.g. for Graphing: plot a linear function, a quadratic, a
function with a domain error, an empty/invalid expression) to run before
considering that mode's implementation done.

## 6. Build order

1. This spec (architecture-level) — done
2. Rename `geometry-canvas` → `math-canvas`; add mode switcher; port existing
   Geometry mode behavior unchanged (regression-safe baseline)
3. Geometry mode upgrade: angle tool, midpoint/perpendicular-bisector tools
4. Graphing mode: expression parser + function plotting
5. Vector mode: vectors + translate/reflect/rotate/dilate
6. Statistics mode: histogram/bar chart from numeric input

Steps 2-6 each get their own design-and-plan cycle (via `writing-plans`)
before implementation, using this document as the architectural contract.

## 7. Naming

Skill renamed from `geometry-canvas` to `math-canvas`. The skill's
`description` and trigger phrases will be updated to cover the broader
scope (graphing, vectors, statistics) in addition to the existing geometry
triggers, when step 2 is implemented.
