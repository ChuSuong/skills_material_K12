# Apparatus content-fit matrix

This document defines which apparatus families are allowed to hold which content
kinds, and why. It is the source of truth backing
`isCompatibleContent()` / `assertContentFit()` in `lib/apparatus/capabilities.js`
and `lib/apparatus/contract.js`.

Scene code should call `assertContentFit(apparatus, contentKind)` whenever it
places built-in samples or liquid volume into a container. Placing a separate
apparatus **inside** another apparatus (e.g. dropping a zinc-granule apparatus
into a beaker of HCl) is a different concern and is not gated by this contract.

## Content kinds

The vocabulary is fixed by `CONTENT_KINDS`:

| kind      | meaning                                                             |
| --------- | ------------------------------------------------------------------- |
| `liquid`  | Free-surface liquid controlled by a liquid controller.              |
| `solid`   | Granules, powder, chunks — anything rendered by a granule pile.     |
| `gas`     | A colored/opaque gas volume filling the container.                  |
| `burner`  | A fuel reservoir + wick + flame system (heat source).               |
| `tool`    | The apparatus itself is the payload (paper, rod, clamp, stand).     |

## Family → allowed content kinds

Defined in `FAMILY_CONTENT_ALLOW_LIST` (`lib/apparatus/capabilities.js`).

| family                 | allowed         | rationale                                                                 |
| ---------------------- | --------------- | ------------------------------------------------------------------------- |
| `showcase-vessel`      | `liquid`        | Open vessels (beaker, graduated cylinder, round-bottom flask, test-tube) hold aqueous reagents; solids sit in dedicated jars. |
| `showcase-solid-jar`   | `solid`         | Wide-mouth jar with a ground-glass stopper — matches how solids (Zn, Fe, CaCO3) are shelved. |
| `showcase-bottle`      | `liquid`        | Reagent bottle with a stopper is the standard liquid-storage silhouette; putting granules through a narrow neck is not real-world. |
| `showcase-heat-source` | `burner`        | Alcohol lamp reservoir carries fuel + wick, not a lab reagent.            |
| `showcase-tool`        | `tool`          | Funnels, stirring rods, dropper stems — carry themselves.                 |
| `showcase-metal-sample`| `solid`         | Copper piece, iron nail — a bare metal chunk is itself a solid sample.    |
| `showcase-support`     | `tool`          | Test-tube rack, retort stand — hold other apparatus, not reagents.        |
| `showcase-moist-paper` | `tool`, `solid` | Damp litmus/paper indicator — the paper is the reagent surface and can carry a small solid deposit. |

## Preset → declared contentKind

Each concrete preset should set `meta.contentKind` (and the flattened
`contentKind` on the contract) to be explicit rather than rely on family
fallback. The fallback is the safety net, not the primary source.

| preset                        | family                 | declared contentKind |
| ----------------------------- | ---------------------- | -------------------- |
| `classic-beaker`              | `showcase-vessel`      | `liquid`             |
| `classic-graduated-cylinder`  | `showcase-vessel`      | `liquid`             |
| `classic-round-bottom-flask`  | `showcase-vessel`      | `liquid`             |
| `classic-test-tube`           | `showcase-vessel`      | `liquid`             |
| `classic-reagent-bottle`      | `showcase-bottle`      | `liquid`             |
| `classic-widemouth-jar`       | `showcase-solid-jar`   | `solid`              |
| `classic-alcohol-lamp`        | `showcase-heat-source` | `burner`             |
| `classic-funnel`              | `showcase-tool`        | `tool`               |

## Enforcement

- `isCompatibleContent(apparatus, contentKind)` returns `true` if the declared
  `contentKind` matches, otherwise falls back to the family allow list.
- `assertContentFit(apparatus, contentKind)` throws with a message pointing to
  the correct container, e.g.:

  ```
  assertContentFit: classic-reagent-bottle cannot hold contentKind='solid'.
  Use a container whose family matches this content
  (e.g. classic-widemouth-jar for solids, classic-reagent-bottle for liquids).
  ```

See `docs/apparatus-standard.md` for anchor discipline that this contract
complements — anchors say *where* content sits; the fit matrix says *what*
content is allowed to sit there.
