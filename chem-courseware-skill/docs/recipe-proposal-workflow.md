# Recipe Proposal Workflow

Use this workflow when a chemistry 3D experiment request does not map to a recipe currently supported by `scripts/build-recipe-scene.mjs`.

## Decision Tree

1. Match the lesson request to a supported recipe.
2. If the recipe is supported by `scripts/build-recipe-scene.mjs`, create `semantic-draft.json`, compile, assemble, and verify.
3. If the request matches a known pattern but has no supported builder, create `recipe-proposal.json`.
4. If no pattern matches, create an analysis draft and ask for human confirmation before adding a new pattern.

Do not hand-author a standalone HTML scene for an unsupported recipe.

## Proposal Contract

`recipe-proposal.json` must use:

```json
{
  "kind": "recipe-proposal",
  "status": "needs-builder",
  "matchedPattern": "drag-pour-reaction",
  "referenceCases": ["sugar-h2so4-dehydration"],
  "proposedRecipe": {
    "id": "new-recipe-id",
    "requiredApparatus": ["reagent-bottle", "beaker"],
    "interaction": "free-drag-pour",
    "reaction": "pour-into-vessel",
    "effects": ["pour-stream", "bubble-field", "color-transition"],
    "steps": []
  },
  "builder": {
    "supported": false
  },
  "verification": {
    "validateOnly": true,
    "mustNotGenerateHtml": true
  }
}
```

## Commands

Create a scaffold from a known pattern:

```bash
rtk node scripts/propose-recipe-from-pattern.mjs \
  --pattern drag-pour-reaction \
  --id vinegar-baking-soda-gas-release \
  --topic "Giấm tác dụng với baking soda tạo khí CO2" \
  --out examples/proposals/vinegar-baking-soda-gas-release/recipe-proposal.json
```

Validate a proposal:

```bash
rtk node scripts/validate-recipe-proposal.mjs examples/proposals/vinegar-baking-soda-gas-release/recipe-proposal.json
```

## Production Gate

A proposal is not learner output. It is a backlog item for builder/runtime work. Standalone HTML can be generated only after:

- the proposed recipe is promoted to `recipes/*.recipe.json`
- `scripts/build-recipe-scene.mjs` supports it
- source audits pass
- `npm run verify:pw:contract` passes on the assembled HTML
