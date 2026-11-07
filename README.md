# NekoSune Game Tracker — npm package collection

**Author:** NekoSuneVR · **License:** MIT · **Packages:** `@nekosuneprojects/*`

Independent game and player-statistics tracker modules, developed in individual branches of this repository and published as separate npm packages.

> This `main` branch is the central directory and setup guide, **not** a package that combines game APIs into a single npm release. The individual tracker modules are independently installable.

## Find a tracker

- [Browse all tracker branches](https://github.com/NekoSuneProjectsNPM/game-tracker/branches) — each tracker branch is its own source code, README, tests, npm package and release history.
- [Reusable tracker starter (TEMPLATE)](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE)
- [Published npm namespace](https://www.npmjs.com/org/nekosuneprojects)
- [GitHub releases](https://github.com/NekoSuneProjectsNPM/game-tracker/releases)
- [Bug reports / feature requests](https://github.com/NekoSuneProjectsNPM/game-tracker/issues)

### Tracker directory

New trackers will be listed here **after their branches and packages exist**. A branch is not automatically a working tracker: refer to its own README to confirm provider support, required credentials, compatible games and limitations.

| Tracker | Source branch | npm installation | Status |
| --- | --- | --- | --- |
| Starter (not publishable) | [TEMPLATE](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE) | N/A | Ready to adapt |

## Install individual trackers

Each branch is published under its own scoped name, such as:

```bash
npm install @nekosuneprojects/fortnite-api
```

**Illustrative package name only:** install commands will work only once that tracker is implemented and actually published.

Use CommonJS:

```js
const Fortnite = require('@nekosuneprojects/fortnite-api');
const fortniteTracker = Fortnite({ apiKey: process.env.FORTNITE_API_KEY });
// Example only: check the Fortnite branch for actual auth requirements and methods.
```

You may install as many different tracker modules as needed into one Node.js application. Every module operates independently; no central API keys or shared runtime are assumed.

### Using several trackers without naming conflicts

```js
const Fortnite = require('@nekosuneprojects/fortnite-api');
const APEX = require('@nekosuneprojects/apex-api');
const WarThunder = require('@nekosuneprojects/war-thunder-api');

const fortniteTracker = Fortnite({ apiKey: process.env.FORTNITE_API_KEY });
const apexTracker = APEX({ apiKey: process.env.APEX_API_KEY });
const warThunderTracker = WarThunder(); // Example only, if no key is required
```

These package names and authentication requirements are **illustrative**; verify existence and setup in each tracker's branch README. Each tracker exposes its own game-supported methods. Use distinct, game-specific variables instead of a shared `tracker` or `stats` name, and keep credentials separate per provider.

## Create and publish a new tracker

1. Create a branch **from `TEMPLATE`** (not `main`) using a lowercase name like `fortnite-api`.
2. Rename the package in `package.json` to `@nekosuneprojects/fortnite-api`. Keep the package suffix identical to the branch name.
3. Implement game-specific integration under `src/`; export your API from `index.js`.
4. Document actual supported endpoints, installation, configuration, API key requirements, usage, limitations and source attribution in that branch's `README.md`. Use game-specific module and instance names (such as `Fortnite` / `fortniteTracker`), never a generic `tracker` example.
5. Add tests and run `npm test`, `npm run check` and `npm pack --dry-run`.
6. Configure a GitHub Actions secret named `NPM_TOKEN` with npm publish permissions for the `@nekosuneprojects` organisation. The npm scope and package permissions must already be set up on npmjs.com.
7. Push to the tracker branch. The inherited publishing workflow checks tests and pack contents, then publishes **only that branch's package** to npm, bumps patch version when necessary, and creates a branch-prefixed GitHub release.

### Publication policies

- `main` collects documentation and links; **never** publishes a tracker.
- `TEMPLATE` is an unpublishable starter; **never** publishes.
- Each tracker branch must have exactly one `@nekosuneprojects/<branch>` package.
- All packages keep `main: "index.js"`, `type: "commonjs"`, author NekoSuneVR and MIT licence.
- Each package's `repository`, `bugs` and funding metadata must refer to this project.
- Every code update that passes CI on a tracker branch triggers an npm release attempt; patch versions advance relative to the last published version. For breaking changes or new features, set a higher major/minor version deliberately before publishing.
- Release versions can never be reused on npm. If publishing fails, inspect the GitHub Actions logs and fix the cause.
- A project's GitHub release tag is `<branch>-v<version>` so identical versions of different tracker packages do not conflict.
- npm publication requires npm credentials and appropriate package permissions. Creating the GitHub workflow **does not** itself configure npm.

## Game data and integrations

Trackers should prefer official APIs, then legitimate third-party services where permitted. Clearly label unofficial functionality. Do not claim locally-only game information is available from public endpoints. A future optional local companion app can handle PC-local data after authorisation.

## Links

Repository: https://github.com/NekoSuneProjectsNPM/game-tracker  
Issues: https://github.com/NekoSuneProjectsNPM/game-tracker/issues  
Funding: https://github.com/NekoSuneProjectsNPM/game-tracker?sponsor

MIT © NekoSuneVR
