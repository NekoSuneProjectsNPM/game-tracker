# NekoSune Game Tracker — npm package collection

**Author:** NekoSuneVR · **License:** MIT · **Packages:** `@nekosuneprojects/*`

Independent game and player-statistics tracker modules, supporting **offline JSON data, GitHub JSON synchronization, official/authorised direct APIs, and hybrid data sources**, developed in individual branches and published as separate npm packages.

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
7. Push code without publishing. Run the manual Actions workflow and enter that tracker branch to release its exact package.json version.

## Manual releases (no automatic publishing on push)

Normal commits and pushes **never** publish or increment package versions. Set `package.json` version yourself, run `npm install --package-lock-only`, and commit both package files with your code.

Open [Actions: Manually publish tracker version](https://github.com/NekoSuneProjectsNPM/game-tracker/actions/workflows/publish.yml), choose **Run workflow** using the `main` workflow ref, and enter `tracker_branch` (such as `fortnite-api`). The input is text rather than a dynamic branch dropdown. `main` and `TEMPLATE` are blocked. The workflow reads the **exact version in the selected branch's package.json**, verifies the lockfile and tests, then creates tag `<branch>-v<version>`. No version files are edited or committed.

Only that manually created published GitHub Release triggers the npmjs.org and GitHub Packages release workflows. `RELEASE_TOKEN` with Contents write is needed so that release-created workflows are triggered. The registries also require valid publishing credentials and self-hosted runner availability.

### Publication policies

- `main` collects documentation and links; **never** publishes a tracker.
- `TEMPLATE` is an unpublishable starter; **never** publishes.
- Each tracker branch must have exactly one `@nekosuneprojects/<branch>` package.
- All packages keep `main: "index.js"`, `type: "commonjs"`, author NekoSuneVR and MIT licence.
- Each package's `repository`, `bugs` and funding metadata must refer to this project.
- Pushes never publish. Set the package.json and lockfile version manually and start the release workflow for one tracker branch.
- Release versions can never be reused on npm. If publishing fails, inspect the GitHub Actions logs and fix the cause.
- A project's GitHub release tag is `<branch>-v<version>` so identical versions of different tracker packages do not conflict.
- npm publication requires npm credentials and appropriate package permissions. Creating the GitHub workflow **does not** itself configure npm.

## Local JSON and GitHub-synced data

Individual game trackers can expose `gameTracker.data.get('meta.json')`, `gameTracker.data.list()` and `gameTracker.data.sync()` for JSON files. A tracker selects a fixed public GitHub data directory (for example [gaming-infos/data/warframe](https://github.com/NekoSuneProjectsNPM/gaming-infos/tree/main/data/warframe)) in its own `src/data-source.js`.

The synchronizer downloads only new/changed files by comparing Git blob hashes, caches JSON to disk, and supports reading cached files offline. Each game can also bundle files under `data/`. Changes to GitHub JSON do not require a new npm version. The shared [TEMPLATE usage guide](https://github.com/NekoSuneProjectsNPM/game-tracker/tree/TEMPLATE) contains a Warframe illustration, cache configuration and an [AI JSON editing prompt](https://github.com/NekoSuneProjectsNPM/game-tracker/blob/TEMPLATE/docs/AI-JSON-PROMPT.md).

## Game data and integrations

Trackers may use entirely local JSON without an external API, or combine that data with official APIs and legitimate third-party services where permitted. Clearly label unofficial functionality. Do not claim locally-only game information is available from public endpoints. A future optional local companion app can handle PC-local data after authorisation.

## Links

Repository: https://github.com/NekoSuneProjectsNPM/game-tracker  
Issues: https://github.com/NekoSuneProjectsNPM/game-tracker/issues  
Funding: https://github.com/NekoSuneProjectsNPM/game-tracker?sponsor

MIT © NekoSuneVR
