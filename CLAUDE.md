# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A VS Code extension that provides **live, simulated preview** of Laravel Blade templates as rendered HTML. It does **not** execute PHP or connect to a Laravel backend — it processes Blade directives via regex and renders a best-effort static preview inside a VS Code webview.

Key preview behaviours:
- Blade variables `{{ $x }}` → styled badge `[x]`
- Raw output `{!! $x !!}` → styled badge `[RAW: x]`
- Control structures, directives → HTML comments (visible for debugging)
- Local CSS/JS referenced in the template is auto-resolved from common Laravel directories and injected
- CDN CSS/JS (Bootstrap, Tailwind, Font Awesome, etc.) is detected and loaded directly

Known intentional limitations: `@extends`/`@include` do not pull in parent/partial files; PHP blocks are stripped; dynamic data shows as placeholders.

## Commands

```bash
npm install          # install dependencies
npm run compile      # one-off webpack build → dist/extension.js
npm run watch        # webpack in watch mode (for active development)
npm run lint         # eslint src/
npm run package      # production build (minified, hidden source map)
npm run compile-tests  # tsc → out/ (for running tests)
npm test             # compile-tests + compile + lint + vscode-test
```

To run the extension: press `F5` in VS Code. This opens an Extension Development Host with the extension loaded. Open any `.blade.php` file there to test.

## Architecture

**`src/extension.ts`** — activation entry point. Registers two commands (`blade-preview.openPreview`, `blade-preview.openPreviewToSide`) and sets up workspace event listeners (`onDidChangeTextDocument`, `onDidChangeActiveTextEditor`) to keep the preview live as the user edits.

**`src/bladePreviewPanel.ts`** — all preview logic lives here. `BladePreviewPanel` is a singleton (static `currentPanel`). Key responsibilities:

- **Webview creation**: enables scripts, sets `localResourceRoots` to `media/`, `out/`, and all workspace folders so local assets can be served.
- **`_renderBladeTemplate()`**: pure regex pipeline that transforms Blade syntax into displayable HTML. Order matters — comments are stripped first, then directives, then `{{ }}`/`{!! !!}` expressions.
- **Asset extraction**: four private methods (`_extractExternalStyles`, `_extractExternalScripts`, `_extractLocalStyles`, `_extractLocalScripts`) scan the raw Blade content for CDN URLs and local asset references. Local paths are resolved by `_resolveLocalResource()`, which probes these directories in order: as-is, `public/`, `resources/`, `resources/css/`, `resources/js/`, `node_modules/`, `public/build/`.
- **CSP**: `style-src` and `script-src` allow `webview.cspSource`, `'unsafe-inline'`, and `https:` so both local and CDN resources load.

**`media/preview.css`** — styles for the preview panel, including `.blade-variable`, `.blade-raw`, and `.warning-banner`.  
**`media/welcome.css`** — styles for the welcome screen shown when no Blade file is open.

**Build**: Webpack bundles `src/extension.ts` → `dist/extension.js` (CommonJS, Node target). `vscode` is externalized. TypeScript via `ts-loader`.

**Tests**: `src/test/extension.test.ts` runs via `@vscode/test-cli` inside a real VS Code instance (see `.vscode-test.mjs`).

## Adding new Blade directive support

All directive processing is in `_renderBladeTemplate()` in `bladePreviewPanel.ts`. Add new regex replacements there following the existing pattern. Directives that wrap content blocks need both an opening and closing handler.
