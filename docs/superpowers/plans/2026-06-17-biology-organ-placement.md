# Biology Organ Placement MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/biology` page to `chemistry-virtual-lab` where a student selects a heart model in a sidebar tray and clicks an anchor point on a 3D skeleton's chest to place it there, with a warning shown if they click the skeleton anywhere else.

**Architecture:** A Next.js pages-router route (`pages/biology/index.tsx`) holds UI state (which organ is selected, which are placed, warning text) and renders an `OrganTray` sidebar plus a `BiologyLabScene` `<Canvas>` (react-three-fiber). `BiologyLabScene` renders the `Skeleton` (loads `skeleton.glb`, exposes an anchor marker mesh and a click handler for "wrong spot"), and conditionally renders `Heart` (loads `heart.glb`) once placed. Organ metadata (id, label, asset path, anchor position) lives in one shared `organs.ts` config so the tray and scene stay in sync.

**Tech Stack:** Next.js 16 (pages router), React 19, `three`, `@react-three/fiber`, `@react-three/drei` (new deps), TypeScript.

---

## File Structure

- Create: `chemistry-virtual-lab/public/assets/biology/skeleton.glb` — copied from provided skeleton model
- Create: `chemistry-virtual-lab/public/assets/biology/heart.glb` — copied from provided heart model
- Create: `chemistry-virtual-lab/components/biology/organs.ts` — shared organ config (id, label, asset path, anchor position, scale)
- Create: `chemistry-virtual-lab/components/biology/Skeleton.tsx` — loads/renders skeleton glb, renders anchor marker(s), handles "clicked wrong spot"
- Create: `chemistry-virtual-lab/components/biology/Heart.tsx` — loads/renders heart glb at a given position/scale
- Create: `chemistry-virtual-lab/components/biology/OrganTray.tsx` — sidebar list of organs, selection + placed state UI
- Create: `chemistry-virtual-lab/components/biology/BiologyLabScene.tsx` — `<Canvas>`, lighting, `OrbitControls`, composes `Skeleton` + placed `Heart`
- Create: `chemistry-virtual-lab/pages/biology/index.tsx` — page: owns state, renders `OrganTray` + `BiologyLabScene`, warning banner
- Modify: `chemistry-virtual-lab/package.json` — add `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

No automated test framework exists in this project (no `test` script, no Jest/Vitest config). Per the design spec, verification for this feature is manual (run the dev server, interact in the browser) plus `tsc --noEmit` as a type-safety check after each component is added.

---

### Task 1: Add 3D rendering dependencies

**Files:**
- Modify: `chemistry-virtual-lab/package.json`

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /home/sofier/skills_material_K12/chemistry-virtual-lab && yarn add three @react-three/fiber @react-three/drei && yarn add -D @types/three
```

- [ ] **Step 2: Verify install**

Run: `node -e "require('three/package.json')" && grep -E '"(three|@react-three/fiber|@react-three/drei)"' chemistry-virtual-lab/package.json`

Expected: prints the three package's `package.json` path with no error, and the grep shows all three packages listed under `dependencies`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/package.json chemistry-virtual-lab/yarn.lock && git commit -m "$(cat <<'EOF'
Add three.js / react-three-fiber deps for biology lab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add the glb assets

**Files:**
- Create: `chemistry-virtual-lab/public/assets/biology/skeleton.glb`
- Create: `chemistry-virtual-lab/public/assets/biology/heart.glb`

- [ ] **Step 1: Copy the provided models into the project**

```bash
mkdir -p /home/sofier/skills_material_K12/chemistry-virtual-lab/public/assets/biology
cp "/home/sofier/skills_material_K12/664230045_human_skeleton_stand_still.glb" \
   /home/sofier/skills_material_K12/chemistry-virtual-lab/public/assets/biology/skeleton.glb
cp "/home/sofier/skills_material_K12/heart_3d_-_organ.glb" \
   /home/sofier/skills_material_K12/chemistry-virtual-lab/public/assets/biology/heart.glb
```

- [ ] **Step 2: Verify the files copied correctly**

Run: `file chemistry-virtual-lab/public/assets/biology/*.glb`

Expected: both lines say `glTF binary model, version 2`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/public/assets/biology
git commit -m "$(cat <<'EOF'
Add skeleton and heart glb assets for biology lab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Shared organ config

**Files:**
- Create: `chemistry-virtual-lab/components/biology/organs.ts`

- [ ] **Step 1: Write the config file**

```typescript
export type OrganId = 'heart'

export type OrganDef = {
  id: OrganId
  label: string
  modelPath: string
  // Position of this organ's anchor point in the skeleton's local space.
  // Calibrated against the skeleton model in Task 6 — these are starting
  // guesses for a roughly chest-high, front-facing point.
  anchorPosition: [number, number, number]
  // Scale applied to the organ's own glb when placed at the anchor.
  placedScale: number
}

export const ORGANS: OrganDef[] = [
  {
    id: 'heart',
    label: 'Tim',
    modelPath: '/assets/biology/heart.glb',
    anchorPosition: [0, 1.4, 0.2],
    placedScale: 0.15,
  },
]

export function getOrgan(id: OrganId): OrganDef {
  const organ = ORGANS.find(o => o.id === id)
  if (!organ) throw new Error(`Unknown organ id: ${id}`)
  return organ
}
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors referencing `organs.ts`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/organs.ts
git commit -m "$(cat <<'EOF'
Add shared organ config for biology lab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Skeleton component with anchor marker

**Files:**
- Create: `chemistry-virtual-lab/components/biology/Skeleton.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useGLTF } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { OrganDef } from './organs'

type SkeletonProps = {
  selectedOrgan: OrganDef | null
  onAnchorClick: () => void
  onWrongSpotClick: () => void
}

const SKELETON_PATH = '/assets/biology/skeleton.glb'
const SKELETON_SCALE = 1
const SKELETON_POSITION: [number, number, number] = [0, 0, 0]

export default function Skeleton({ selectedOrgan, onAnchorClick, onWrongSpotClick }: SkeletonProps) {
  const { scene } = useGLTF(SKELETON_PATH)

  function handleSkeletonClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    if (selectedOrgan) onWrongSpotClick()
  }

  return (
    <group position={SKELETON_POSITION} scale={SKELETON_SCALE}>
      <primitive object={scene} onClick={handleSkeletonClick} />

      {selectedOrgan && (
        <mesh
          position={selectedOrgan.anchorPosition}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation()
            onAnchorClick()
          }}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload(SKELETON_PATH)
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors referencing `Skeleton.tsx`. (Errors about `BiologyLabScene`/`OrganTray`/`pages/biology` not existing yet are expected and will be resolved in later tasks — ignore those for now.)

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/Skeleton.tsx
git commit -m "$(cat <<'EOF'
Add Skeleton component with placement anchor marker

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Heart component

**Files:**
- Create: `chemistry-virtual-lab/components/biology/Heart.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useGLTF } from '@react-three/drei'
import { OrganDef } from './organs'

type HeartProps = {
  organ: OrganDef
}

const HEART_PATH = '/assets/biology/heart.glb'

export default function Heart({ organ }: HeartProps) {
  const { scene } = useGLTF(HEART_PATH)

  return (
    <primitive object={scene} position={organ.anchorPosition} scale={organ.placedScale} />
  )
}

useGLTF.preload(HEART_PATH)
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors referencing `Heart.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/Heart.tsx
git commit -m "$(cat <<'EOF'
Add Heart component for placed-organ rendering

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: OrganTray sidebar

**Files:**
- Create: `chemistry-virtual-lab/components/biology/OrganTray.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { ORGANS, OrganId } from './organs'

type OrganTrayProps = {
  selectedOrganId: OrganId | null
  placedOrganIds: Set<OrganId>
  onSelect: (id: OrganId) => void
}

export default function OrganTray({ selectedOrganId, placedOrganIds, onSelect }: OrganTrayProps) {
  return (
    <aside style={{ width: 220, padding: 16, borderRight: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Nội tạng</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ORGANS.map(organ => {
          const isPlaced = placedOrganIds.has(organ.id)
          const isSelected = selectedOrganId === organ.id
          return (
            <li key={organ.id}>
              <button
                type="button"
                disabled={isPlaced}
                onClick={() => onSelect(organ.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #3555d3' : '1px solid #d6dbe5',
                  background: isPlaced ? '#f1f5f9' : '#fff',
                  color: isPlaced ? '#94a3b8' : '#0f172a',
                  cursor: isPlaced ? 'not-allowed' : 'pointer',
                }}
              >
                {organ.label} {isPlaced ? '✓' : ''}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors referencing `OrganTray.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/OrganTray.tsx
git commit -m "$(cat <<'EOF'
Add OrganTray sidebar component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: BiologyLabScene (Canvas composition)

**Files:**
- Create: `chemistry-virtual-lab/components/biology/BiologyLabScene.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import Skeleton from './Skeleton'
import Heart from './Heart'
import { OrganDef, OrganId, getOrgan } from './organs'

type BiologyLabSceneProps = {
  selectedOrgan: OrganDef | null
  placedOrganIds: Set<OrganId>
  onAnchorClick: () => void
  onWrongSpotClick: () => void
}

export default function BiologyLabScene({
  selectedOrgan,
  placedOrganIds,
  onAnchorClick,
  onWrongSpotClick,
}: BiologyLabSceneProps) {
  return (
    <Canvas camera={{ position: [0, 1.4, 3.2], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <Suspense fallback={null}>
        <Skeleton
          selectedOrgan={selectedOrgan}
          onAnchorClick={onAnchorClick}
          onWrongSpotClick={onWrongSpotClick}
        />
        {Array.from(placedOrganIds).map(id => (
          <Heart key={id} organ={getOrgan(id)} />
        ))}
      </Suspense>
      <OrbitControls target={[0, 1.2, 0]} />
    </Canvas>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors referencing `BiologyLabScene.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/BiologyLabScene.tsx
git commit -m "$(cat <<'EOF'
Add BiologyLabScene canvas composition

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Biology page wiring state

**Files:**
- Create: `chemistry-virtual-lab/pages/biology/index.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { OrganId, getOrgan } from '@/components/biology/organs'

const BiologyLabScene = dynamic(() => import('@/components/biology/BiologyLabScene'), { ssr: false })
import OrganTray from '@/components/biology/OrganTray'

export default function BiologyPage() {
  const [selectedOrganId, setSelectedOrganId] = useState<OrganId | null>(null)
  const [placedOrganIds, setPlacedOrganIds] = useState<Set<OrganId>>(new Set())
  const [warning, setWarning] = useState<string | null>(null)

  const selectedOrgan = selectedOrganId ? getOrgan(selectedOrganId) : null

  function handleSelect(id: OrganId) {
    setSelectedOrganId(id)
    setWarning(null)
  }

  function handleAnchorClick() {
    if (!selectedOrganId) return
    setPlacedOrganIds(prev => new Set(prev).add(selectedOrganId))
    setSelectedOrganId(null)
    setWarning(null)
  }

  function handleWrongSpotClick() {
    setWarning('Sai vị trí, hãy thử lại')
  }

  return (
    <>
      <Head>
        <title>Phòng Lab Sinh Học - Gán Nội Tạng</title>
      </Head>
      <div style={{ display: 'flex', height: '100vh' }}>
        <OrganTray
          selectedOrganId={selectedOrganId}
          placedOrganIds={placedOrganIds}
          onSelect={handleSelect}
        />
        <div style={{ flex: 1, position: 'relative' }}>
          {warning && (
            <div
              role="alert"
              style={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff1f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '8px 16px',
                borderRadius: 8,
                zIndex: 10,
              }}
            >
              {warning}
            </div>
          )}
          <BiologyLabScene
            selectedOrgan={selectedOrgan}
            placedOrganIds={placedOrganIds}
            onAnchorClick={handleAnchorClick}
            onWrongSpotClick={handleWrongSpotClick}
          />
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/pages/biology/index.tsx
git commit -m "$(cat <<'EOF'
Add /biology page with organ placement state

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Calibrate the anchor position and run end-to-end manual verification

**Files:**
- Modify: `chemistry-virtual-lab/components/biology/organs.ts` (tune `anchorPosition`/`placedScale`)
- Modify: `chemistry-virtual-lab/components/biology/Skeleton.tsx` (tune `SKELETON_SCALE`/`SKELETON_POSITION` if the skeleton renders far too large/small or off-center)

- [ ] **Step 1: Start the dev server**

Run: `cd /home/sofier/skills_material_K12/chemistry-virtual-lab && yarn dev`

Expected: server starts on `http://localhost:3000`.

- [ ] **Step 2: Open the page and check the skeleton renders sanely**

Open `http://localhost:3000/biology` in a browser. Confirm the skeleton model is visible and roughly centered using `OrbitControls` (drag to rotate, scroll to zoom). If the model is enormous, tiny, or way off to one side, adjust `SKELETON_SCALE`/`SKELETON_POSITION` in `Skeleton.tsx` and refresh — repeat until the skeleton sits comfortably in view at the default camera position `[0, 1.4, 3.2]`.

- [ ] **Step 3: Select the heart and check the anchor marker position**

Click "Tim" in the sidebar tray. A small glowing green sphere (the anchor marker) should appear on the skeleton. If it floats away from the chest area, edit `anchorPosition` in `organs.ts` (it's in the skeleton's local coordinate space, same units as `SKELETON_SCALE`) and refresh. Repeat until the marker sits visibly on the chest.

- [ ] **Step 4: Verify correct placement**

With "Tim" selected and the marker on the chest, click the marker. The heart model should appear at that position, the marker should disappear, the warning banner should not show, and the "Tim" item in the tray should show a checkmark and become disabled.

- [ ] **Step 5: Verify wrong-placement feedback**

Reload the page (state resets), click "Tim" to select it, then click anywhere on the skeleton body that is *not* the anchor marker. Confirm the "Sai vị trí, hãy thử lại" banner appears at the top of the canvas area, and that the heart is not placed.

- [ ] **Step 6: Final type-check**

Run: `cd chemistry-virtual-lab && npx tsc --noEmit`

Expected: no errors across the whole project.

- [ ] **Step 7: Commit any calibration tweaks**

```bash
cd /home/sofier/skills_material_K12 && git add chemistry-virtual-lab/components/biology/organs.ts chemistry-virtual-lab/components/biology/Skeleton.tsx
git commit -m "$(cat <<'EOF'
Calibrate skeleton scale and heart anchor position

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

If there is nothing to commit (no tweaks were needed), skip this step.

---

## Self-Review Notes

- **Spec coverage:** route (Task 8), react-three-fiber/drei rendering (Tasks 4/5/7), assets copied to `public/assets/biology` (Task 2), click-to-select-then-click-to-place flow with wrong-spot warning (Tasks 4/8/9), manual testing (Task 9), no Sketchfab API/persistence/drag-drop added (out of scope, not built). All spec sections are covered.
- **Type consistency:** `OrganId`/`OrganDef`/`getOrgan` defined once in `organs.ts` (Task 3) and imported consistently by `Skeleton`, `Heart`, `OrganTray`, `BiologyLabScene`, and the page — no renamed duplicates.
- **No placeholders:** every step has runnable commands or complete code.
