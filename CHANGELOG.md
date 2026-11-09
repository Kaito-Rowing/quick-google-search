# Changelog

## 1.0.1 — Unreleased

### Fixed
- Isolate the selection button in Shadow DOM and reset its transparent host, preventing page styles from creating a square border or background.
- Replace unsupported SVG manifest icons with PNG assets.
- Clear outdated selections, cancel pending updates on dismissal, and verify the current selection before searching.

### Added
- Keyboard selection, keyboard activation, Escape dismissal and forced-colors support.
- English and Japanese extension messages and separate READMEs.
- Real-extension browser tests, asset validation, CI and allowlisted ZIP packaging.
- Privacy policy, contribution guide and store submission notes.

### Changed
- Limit content-script matches to HTTP and HTTPS pages.
- Exclude form inputs and editable content from search suggestions to reduce accidental disclosure of drafts or sensitive text.

## 1.0.0

- Initial version: select text and open Google Search from a nearby button.
