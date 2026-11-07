# JsonData — game-tracker's JSON data branch

**This branch stores data only. It is NOT an npm package and must never be published.** All game tracker packages read these files through their own local data cache.

## Layout

```text
games/
  warframe/
    meta.json
    characters/
      ash.json
      ashprime.json
    items/
    codes/
    maps/
  <new-game-id>/
    meta.json
    characters/
    items/
    codes/
    maps/
```

Git doesn't store empty directories; create category directories by adding JSON files when you need them. Use lower-case, stable record filenames such as `ash.json` and `ashprime.json`.

The tracker module for each game sets `gameId` in its `src/data-source.js`; its GitHub JSON source is fixed to this repository, branch `JsonData`, and folder `games/<gameId>`.

## Reusable record convention

One JSON object per record. Suggested fields:

```json
{
  "id": "ash",
  "name": "Ash",
  "aliases": [],
  "description": "",
  "source": ""
}
```

Only include fields for which you have accurate data. Additional fields are allowed for game-specific datasets. Keep each record's `id` unique within its category. When adding characters with similar names, separate IDs and filenames prevent ambiguity.

- `games/<game>/characters/<id>.json` — characters (e.g. Ash and Ash Prime)
- `games/<game>/items/<id>.json` — items, equipment
- `games/<game>/codes/<id>.json` — codes and redemption data; never invent active status or expiry
- `games/<game>/maps/<id>.json` — maps and map metadata
- `games/<game>/meta.json` — game overview

## Usage from a game tracker module

```js
const Warframe = require('@nekosuneprojects/warframe-api'); // Future module example only
const warframeTracker = Warframe();

await warframeTracker.data.sync(); // Check GitHub and cache new/changed files.
const options = await warframeTracker.search('Ash');
// options.results has separate entries for Ash and Ash Prime.
const selected = await warframeTracker.character('ash');
```

Search reads the local files and cache. `data.sync()` is explicit and incremental. You can edit JSON on this branch without publishing a new npm package.

## Publishing

Only tracker code branches are manually released through GitHub Actions. The `JsonData` branch is a JSON data repository, not a tracker: **do not select JsonData for npm publishing**. The package-name check will also reject it unless a matching package.json is added, which is not intended.

## Important

The two included Warframe character records below are intentionally minimal layout examples, **not complete Warframe datasets**. No files have been copied from `gaming-infos`. Add and verify your own JSON information.
