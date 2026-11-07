# JSON data authoring guide

Data-only branch for all game-specific JSON. Use `games/<gameId>/<category>/<id>.json` and optional `games/<gameId>/meta.json`.

Each tracker automatically indexes downloaded or bundled JSON by filename, ID, name, aliases, and nested string values. `search('Ash')` finds Ash and Ash Prime; `character('ash')` retrieves the exact record.

Use `id` as a stable filename-compatible slug, a human-friendly `name`, and optionally `aliases`. Extra game-specific keys are fine. Avoid dumping huge unrelated files into one JSON file; separate records allow incremental downloads by Git SHA.

Games may add any category directory, although the starter convenience functions cover characters, items, codes and maps. The generic `record(category,id)` handles any category.

For more detailed code data:

```json
{
  "id": "example-code",
  "name": "Example code",
  "code": "PLACEHOLDER-NOT-REAL",
  "status": "unknown",
  "source": null,
  "expiresAt": null
}
```

The code object above is documentation only, **not a redeemable code**.

When source JSON is updated in GitHub, consumers call `data.sync()` to compare Git blob SHA and cache only changed JSON. Sync never increments npm versions.
