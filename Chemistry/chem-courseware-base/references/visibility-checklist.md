# Visibility checklist

Review against the three screenshots produced by `scripts/pw-capture-checkpoints.mjs`
(`idle.png`, `mid.png`, `aftermath.png`) before calling a lesson render-verified.

- [ ] At rest (after an auto-trigger animation finishes, or after a manual drag is
      released), is the interactive object actually inside its own activation zone —
      not just visually close to it? Check the activation-condition function in the
      lesson's own code (e.g. an `isXAboveY()`-style check) against the resting
      position's actual coordinates, not just how it looks in the screenshot.
- [ ] Is the main reactive object (beaker/flask contents, reaction mass, precipitate,
      etc.) clearly identifiable in the screenshot, not blended into a background prop
      or a near-invisible transparent material?
- [ ] Do `idle.png`, `mid.png`, and `aftermath.png` read as three visually distinct
      states at a glance, without zooming in or reading the HUD text?
- [ ] If any of the above fails, fix the underlying scene (position, material opacity,
      camera framing) before spending more effort on shader/particle polish — cosmetic
      upgrades on an invisible phenomenon are wasted work.
