# @nekosuneprojects/replace-me — Game Tracker Template

> **Template only; not an actual game API implementation.** Rename the package and implement your own game's official or authorised third-party API integration before publishing.

## Create a tracker branch

1. Create a new branch **from TEMPLATE**, named for example `fortnite-api`.
2. Change `package.json` name to `@nekosuneprojects/fortnite-api`, update the description, keywords and the initial version if appropriate.
3. Add game-specific request methods to `src/`, export them from `index.js` and write tests.
4. Replace this README with the tracker-specific instructions, supported endpoints, environment variables, API key requirements, sample responses and limitations.
5. Run `npm test`, `npm run check`, `npm pack --dry-run` locally.
6. Configure the repository's `NPM_TOKEN` Actions secret with publish access to the `@nekosuneprojects` scope. GitHub Actions will publish an eligible tracker branch on push after tests pass.

### Example use of the generic transport

```js
const { createTracker } = require('@nekosuneprojects/your-tracker-name');
const tracker = createTracker({
  baseUrl: 'https://api.example.com/v1/',
  apiKey: process.env.GAME_API_KEY,
});
tracker.request('players/example').then(console.log).catch(console.error);
```

This endpoint is illustrative only; it does **not** claim any particular game has this API.

## Branch and publishing model

- `main` = central README, discovery and setup; never published as a tracker.
- `TEMPLATE` = starter code; never published.
- Every other tracker branch is independent: package name, code, tests, README and versions.
- Pushes publish after tests and validation when `NPM_TOKEN` is configured. On each successful workflow, a package version is selected as the next patch version (starting at 2.5.0, never below the currently published npm version), committed back to the tracker branch, and released as `<branch>-v<version>`.
- Do not modify package versions simultaneously with release jobs. Major/minor versions can be chosen by changing package.json before the next publish.
- Published packages are always separate; pushing one branch does not build or publish all branches.

## Security

Never commit credentials or `.env` files. Never expose private profile data without authorisation. Respect publisher rate limits and terms.

MIT © NekoSuneVR
