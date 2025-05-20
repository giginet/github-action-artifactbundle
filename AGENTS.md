# Vibe Coding Guidelines

This repository uses Node.js and TypeScript. Please follow these rules when
contributing:

## Setup

- Use Node.js version listed in `.node-version`.
- Install dependencies with `npm ci`.

## Formatting

- All files are formatted with Prettier.
- Run `npm run format:write` before committing. CI will check
  `npm run format:check`.

## Linting

- Lint source code with ESLint using `npm run lint`.

## Testing

- Run `npm test` (or `npm run ci-test`) to execute Jest tests.
- Add tests for new functionality under `__test__/`.

## Packaging

- Build distributable files with `npm run package`.

## Pull Requests

- Keep commits concise and use the imperative mood.
- Ensure tests and linting pass before opening a PR.
