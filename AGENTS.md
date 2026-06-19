# AGENTS.md

## Project Overview

SmartM is a small Node.js application without external runtime dependencies. The backend is implemented in `index.js` using Node's built-in HTTP APIs, and the frontend lives in `public/` as plain HTML, CSS, and browser JavaScript.

The app stores configuration in `DATA_DIR` or `/data` by default and integrates with Mail.ru Calendar over CalDAV.

## Repository Layout

- `index.js` - HTTP server, API routes, CalDAV integration, config persistence, ICS/XML helpers.
- `public/index.html` - single-page UI markup.
- `public/app.js` - browser-side state, API calls, rendering, and event handlers.
- `public/styles.css` - application styling.
- `package.json` - project metadata and scripts.
- `amvera.yml` - deployment configuration.

## Commands

- `npm start` - start the app with `node index.js`.
- `PORT=3000 DATA_DIR=.data npm start` - run locally with writable config stored in `.data`.

There is currently no test, lint, or build script in `package.json`. If you add one, update this file and `package.json` together.

## Development Guidelines

- Keep the app dependency-light. Do not add packages unless they clearly reduce risk or complexity.
- Preserve the current plain JavaScript structure unless a larger refactor is explicitly requested.
- Prefer small, focused changes over broad rewrites.
- Keep user-facing Russian text consistent with the existing UI.
- Treat employee emails and passwords as sensitive. Do not log credentials, expose them in errors, or commit generated config files.
- Maintain compatibility with Node's built-in APIs already used in the project.

## API And Data Notes

- Config is normalized by `normalizeConfig()` and supports both legacy single-user config and the current `employees` array.
- CalDAV requests rely on Basic Auth generated from the active employee credentials.
- XML and ICS helpers in `index.js` are hand-written; update them carefully and add focused validation when changing parsing behavior.

## Verification

Before handing off changes:

- Run `node --check index.js`.
- Run `node --check public/app.js`.
- Start the app with `DATA_DIR=.data npm start` when behavior changed.
- Manually smoke-test affected UI flows in the browser when touching `public/`.

## Git Hygiene

- Do not overwrite unrelated user changes.
- Do not commit generated local data such as `.data/` or credential-containing config files.
- Keep commits scoped to the task being performed.
