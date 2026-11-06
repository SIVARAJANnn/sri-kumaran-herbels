# Contributing

For a bug report, include the affected soap chapter, browser, viewport size, steps to reproduce, and the expected result. For visual changes, include desktop and mobile screenshots.

## Local workflow

1. Install Node.js 22 or later, clone the repository, and enter `soap-scroll-studio/`.
2. Run `npm ci`, then `npm run dev`.
3. Make focused changes to the client, catalog, or tooling.
4. Run `npm run check` and `node --check dist/app.js`.
5. For media-tooling changes, also run `npm run check:media`.

Check keyboard navigation, chapter anchors, forward/reverse scrolling, narrow screens, and reduced-motion behavior when changing the interface. Preserve the source photographs and archived video clips. Avoid committing secrets, local configuration, dependencies, or temporary media-conversion files.

Discuss substantial design, new integrations, and media replacements in an issue before implementing them. Please identify the source and usage rights of any new media.
