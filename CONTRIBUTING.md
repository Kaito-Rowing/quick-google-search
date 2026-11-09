# Contributing

Keep the extension focused on selection → Google Search. Changes should preserve the absence of storage, tracking, background services and runtime dependencies.

## Local setup

Use Node.js 24. Run `npm ci`, `npx playwright install chromium`, `npm run check` and `npm test`. Load the repository at `chrome://extensions` to try it in Chrome. After any change, reload both the extension and your test page.

The test suite launches Chromium with the real unpacked extension; it does not replace the Chrome API with mocks. Google navigation is intercepted in tests so no sample selections reach Google. Install browser system dependencies with `npx playwright install --with-deps chromium` on Linux.

## Manual checks before release

- Select via drag, double click, and Shift + arrow keys on several regular sites.
- Activate with mouse, Tab + Enter and Tab + Space; dismiss with Escape.
- Check multiline and backward selections, zoom, dark pages, narrow windows and every screen edge.
- Confirm the round button has no square background, border or focus ring when not focused. Keyboard focus should remain clearly visible.
- Confirm inputs, passwords, textareas and rich-text editors do not show the button.
- Check scrolling, nested scrolling, tab switching, navigation and rapid reselection.
- Check restricted pages do not run the extension; inspect `chrome://extensions` for errors.
- Check Japanese and English Chrome UI languages.

## Assets and packaging

`icons/icon128.svg` is the original vector source. Run `npm run icons` after editing it and commit all generated PNGs. Run `npm run package` to create a ZIP containing only runtime files, the license and the privacy policy. Keep `package.json` and `manifest.json` versions aligned. Regenerate the lockfile after dependency changes.

README images use a local demonstration page, not user browsing data. Run `node scripts/demo.mjs` to refresh `docs/demo.png` and the 1280 × 800 store screenshot after a visual change.

## Reporting bugs

Include Chrome version, OS, public URL (if possible), reproduction steps and expected versus actual behavior. Remove personal information from screenshots and selected text. Update both READMEs if user-facing behavior changes.
