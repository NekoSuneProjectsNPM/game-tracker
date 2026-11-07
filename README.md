# NekoSune Game Tracker — Direct API module template

> **TEMPLATE ONLY.** This branch does not implement an actual game API. No invented API endpoints or API requirements are claimed.

Each tracker package integrates a **known, verified game API directly**. Consumers never need to know its URL and cannot override it from public configuration. If a provider requires an API key, consumers pass it with `apiKey`.

## Expected consumer experience (illustrative APEX package)

Once a real `apex-api` tracker exists and its methods are implemented:

```js
const APEX = require('@nekosuneprojects/apex-api');

const apexTracker = APEX({
  apiKey: process.env.APEX_API_KEY
});

const apexStats = await apexTracker.getPlayerStats('example-player');
console.log(apexStats);
```

The Apex package, provider URL, API-key requirement and supported methods above are **examples only**, not claims of an existing working integration.

### Loading environment variables

Node.js 20.6+ supports `node --env-file=.env app.js`. Or use `dotenv` in your consuming app (not required by this template):

```js
require('dotenv').config();
const APEX = require('@nekosuneprojects/apex-api');
const apexTracker = APEX({ apiKey: process.env.APEX_API_KEY });
```

Do not commit `.env` or credentials. When a game API requires **no key**, initialise it simply:

```js
const GAME = require('@nekosuneprojects/game-api');
const gameTracker = GAME();
```

## Collision-free naming for multiple games

Always use a **game-specific module and instance name** in documentation and integration examples; avoid generic `const tracker = ...` or `const stats = ...` when documenting a published tracker. Each game's factory remains isolated in its npm module.

```js
const Fortnite = require('@nekosuneprojects/fortnite-api');
const APEX = require('@nekosuneprojects/apex-api');
const WarThunder = require('@nekosuneprojects/war-thunder-api');

const fortniteTracker = Fortnite({ apiKey: process.env.FORTNITE_API_KEY });
const apexTracker = APEX({ apiKey: process.env.APEX_API_KEY });
const warThunderTracker = WarThunder(); // Only if the chosen provider needs no API key

// API methods are defined by each game's verified provider, and may differ.
```

These are **illustrative imports only**; no unimplemented package is claimed as published. If a game-specific tracker needs a different method name, document the real method in its own README. Separate variables and objects avoid name collisions; CommonJS modules are already independently scoped. Use per-game environment variable names where multiple trackers are installed.

## Build an individual game module

1. Branch from `TEMPLATE` (e.g. `apex-api`). Change `package.json` name to `@nekosuneprojects/apex-api`, description and keywords.
2. Wait for verified official/authorised third-party provider docs, credentials, response examples and any requirements supplied for that game.
3. Set the **fixed internal** API base URL and authentication style in `src/provider.js`; define real routes. No URL goes in consumer-facing config.
4. Implement proper game-specific methods under `src/tracker.js` (player stats, ranked stats, etc. as actually supported), re-export via `index.js`.
5. Only require `apiKey` when the provider actually needs one. Support public/no-key APIs with `GAME()`. Never hard-code credentials.
6. Replace this README with that individual tracker's installation, supported methods, auth, configuration, examples, rate limits and known limitations. Always use game-specific JavaScript identifiers (`fortniteTracker`, `apexTracker`) and per-game key names.
7. Update tests with mocked valid responses, run `npm test`, `npm run check`, `npm pack --dry-run`.
8. Manually start the publishing workflow in GitHub Actions after configuring publishing credentials.

## Manual releases (no automatic publishing on push)

Normal commits and pushes **never** publish or increment package versions. Set `package.json` version yourself, run `npm install --package-lock-only`, and commit both package files with your code.

Open [Actions: Manually publish tracker version](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml), choose **Run workflow** using the `main` workflow ref, and enter `tracker_branch` (such as `fortnite-api`). The input is text rather than a dynamic branch dropdown. `main` and `TEMPLATE` are blocked. The workflow reads the **exact version in the selected branch's package.json**, verifies the lockfile and tests, then creates tag `<branch>-v<version>`. No version files are edited or committed.

Only that manually created published GitHub Release triggers the npmjs.org and GitHub Packages release workflows. `RELEASE_TOKEN` with Contents write is needed so that release-created workflows are triggered. The registries also require valid publishing credentials and self-hosted runner availability.

## Project conventions

- `main` = central package directory; `TEMPLATE` = starter; both excluded from automatic release.
- Every other tracker branch matches its own npm package name: `@nekosuneprojects/<branch>`.
- CommonJS: `main: "index.js"`, `type: "commonjs"`. The default export is the game tracker factory, callable as `APEX({ apiKey })` and assignable to `apexTracker` or another game-specific instance identifier.
- API URLs/endpoints stay internal and must be sourced from verified documentation.
- Never expose a `baseUrl` or `apiUrl` user option unless the project owner explicitly requests that feature for a particular tracker.
- Package versioning is handled by `.github/workflows/publish.yml`; actual registry publication is handled by the two `release: published` workflows.
- Use Node.js 18+ and npm for normal development.

MIT © NekoSuneVR · https://github.com/NekoSuneProjectsNPM/game-tracker
