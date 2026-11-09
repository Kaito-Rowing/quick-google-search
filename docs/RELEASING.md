# Release guide

## Verify the candidate

1. Review the diff and privacy policy. Confirm the manifest still requests no additional API permissions and matches only HTTP/HTTPS.
2. Run `npm ci`, `npx playwright install chromium`, `npm run check`, `npm test` and the manual checks in [CONTRIBUTING.md](../CONTRIBUTING.md).
3. Keep the version in `manifest.json`, `package.json` and `package-lock.json` aligned; update the versioned ZIP names in both READMEs.
4. Run `npm run package`. Extract the ZIP to a clean directory and load that directory in Chrome. Verify selection, searching and extension icons.
5. Review the screenshot and store copy against the actual packaged version.

## Publish a GitHub release

After maintainer review, commit the source changes, change the changelog's Unreleased label to the actual release date, push the branch, and tag `v1.0.1`. The repository already has a `v1.0.0` tag; do not overwrite it. Create a GitHub release with the changelog notes and attach `dist/quick-google-search-1.0.1.zip`. CI only uploads workflow artifacts; it does not publish releases or submit to stores.

## Chrome Web Store submission

- Upload the packaged ZIP, not the full repository.
- Use the text in [STORE_LISTING.md](STORE_LISTING.md) and review it before submitting.
- Use `docs/store-screenshot.png` (1280 × 800, real extension on a sample page). Add any other artwork requested by the current developer dashboard.
- Publish the privacy policy at a stable, publicly accessible URL. After this commit is merged, the repository's `PRIVACY.md` page can be used; confirm it is accessible before entering its URL.
- Explain the single purpose: search explicitly selected web text with Google.
- Explain content-script page access: detect the user's current selection and display the search button. There are no additional API permissions or remote code.
- Review the dashboard's data-use disclosures carefully: the extension locally processes selected website text and sends it to Google only on an explicit search. Do not claim that it never handles or transmits data.
- Complete all dashboard declarations and review the current store requirements. No store listing, review or approval is implied by this package.

After approval, replace the local-install-only note in both READMEs with the verified store link. Keep manual installation as an alternative.

References: [Manifest icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons), [content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
