# Privacy policy

Effective date: November 9, 2026 · [日本語](docs/PRIVACY.ja.md)

Quick Google Search is maintained by Kaito-Rowing. Its single purpose is to open a Google search for text you explicitly choose to search.

## Data used

The content script reads the current text selection and its on-page position to display a search button. It holds the selection temporarily in the current page's memory and clears its reference when the button is hidden, including on selection clearing, dismissal, scrolling, resizing, loss of focus or page departure. It does not persist selections, browsing history, form values or page content in extension storage, browser storage or a developer-operated service. Form fields and editable regions are excluded from the search feature.

## When data leaves the page

Only when you click the button or activate it with the keyboard does the extension place the selected text in the `q` parameter of an HTTPS URL at `https://www.google.com/search` and open it in a new tab. It does not contact a developer-operated server or send analytics, telemetry or background requests. Search tabs use `noopener,noreferrer` so the original page is not exposed through an opener reference or referrer header.

Google processes your search according to [Google's Privacy Policy](https://policies.google.com/privacy). Your browser and Google may record the search URL or query according to their settings. The extension cannot delete those records; manage them through your browser and Google account controls.

## Access and control

The extension declares content-script access to HTTP and HTTPS pages to detect selections and display the button. It requests no additional extension API permissions and uses no remote executable code. You can restrict its site access, disable it or uninstall it at `chrome://extensions`. The developer does not sell or share user data and does not maintain a user-data database.

## Contact and changes

Questions can be raised through [GitHub Issues](https://github.com/Kaito-Rowing/quick-google-search/issues). Do not include sensitive content in public reports. Changes to data handling will be documented in this policy and the changelog before release.
