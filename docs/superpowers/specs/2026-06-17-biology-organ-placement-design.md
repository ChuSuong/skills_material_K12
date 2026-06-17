# Biology 3D Organ Placement — MVP Design

## Goal

Add a new interactive page to the `chemistry-virtual-lab` Next.js app where a student
can select an organ (currently: Heart) and place it onto a human skeleton model at the
correct anatomical position. This is the first step toward a fuller "virtual biology lab"
where multiple organs from Sketchfab can be assembled onto a body.

## Source assets

Both models were manually downloaded from Sketchfab (free, download-permitted) and
provided locally:

- `/home/sofier/skills_material_K12/664230045_human_skeleton_stand_still.glb` → copied to
  `chemistry-virtual-lab/public/assets/biology/skeleton.glb`
- `/home/sofier/skills_material_K12/heart_3d_-_organ.glb` → copied to
  `chemistry-virtual-lab/public/assets/biology/heart.glb`

No Sketchfab API integration in this MVP — models are static files bundled in `public/`.

## Architecture

- New route: `pages/biology/index.tsx`.
- Rendering: `@react-three/fiber` + `@react-three/drei` (new deps), since the project is
  already React/Next — this fits more naturally than wiring up vanilla three.js scripts
  the way the existing chemistry templates do.
- `useGLTF` (drei) loads both `.glb` files client-side from `/assets/biology/`.
- `OrbitControls` (drei) for rotate/zoom/pan around the skeleton.

## Components

- `BiologyLabScene` — top-level R3F `<Canvas>` wrapper: lighting, camera, OrbitControls,
  renders `<Skeleton>` and any placed organs.
- `Skeleton` — loads and renders `skeleton.glb`. Renders a single visible anchor marker
  (small sphere/highlight) at a hardcoded chest position representing where the heart
  belongs. The anchor only appears while an organ is selected and not yet placed.
- `OrganTray` — sidebar list of selectable organs (just "Tim" for now). Clicking an item
  sets it as the "selected organ" (highlighted in tray).
- `Heart` — renders `heart.glb` at the anchor's position/scale once placed.

## Interaction flow (click-to-place, not real drag-and-drop)

1. User clicks "Tim" in the `OrganTray` → it becomes the selected organ; the chest anchor
   marker becomes visible on the skeleton.
2. User clicks the anchor marker → heart model is placed at that position, marker
   disappears, tray item shows a "placed" checkmark.
3. If the user clicks anywhere else on the skeleton while an organ is selected (i.e. not
   the anchor), show a brief inline warning text ("Sai vị trí, hãy thử lại") — no other
   anchors exist yet, so this is effectively the only error case.

Real drag-and-drop (dragging the organ thumbnail and raycasting against the 3D scene
while dragging) is explicitly out of scope for this MVP and can be a follow-up once more
organs exist.

## Out of scope

- Sketchfab API/OAuth integration for searching/downloading models dynamically.
- Multiple organs/anchors, scoring, persistence (no DB writes for this page).
- Mobile/touch drag gestures.

## Testing

Manual verification only: run `yarn dev` in `chemistry-virtual-lab`, open `/biology`,
confirm the skeleton renders, the heart can be selected and placed at the chest anchor,
and clicking elsewhere shows the warning.
