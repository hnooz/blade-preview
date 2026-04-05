# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A VS Code extension that provides **live, simulated preview** of Laravel Blade templates as rendered HTML. It does **not** execute PHP or connect to a Laravel backend — it processes Blade directives via regex and renders a best-effort static preview inside a VS Code webview.

Key preview behaviours:
- Blade variables `{{ $x }}` → clean text (variable name, or default if null-coalesce)
- `{{ config('app.name') }}` → last segment of the key ("name")
- Control structures (`@if`, `@foreach`, etc.) → content shown, directives stripped
- CDN CSS/JS (Bootstrap, Tailwind, Font Awesome, etc.) is detected and loaded directly
- `@extends`/`@include` do not pull in parent/partial files; PHP blocks are stripped

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

To package: `npx @vscode/vsce package --no-dependencies` → produces `.vsix` file.

## Architecture

**`src/extension.ts`** — Activation entry point. Registers two commands (`blade-preview.openPreview`, `blade-preview.openPreviewToSide`) and sets up workspace event listeners (`onDidChangeTextDocument`, `onDidChangeActiveTextEditor`) to keep the preview live.

**`src/bladePreviewPanel.ts`** — Singleton `BladePreviewPanel` managing VS Code webview lifecycle only. Orchestrates the rendering pipeline: extract CDN resources → strip resource tags → render blade → extract document parts → build final HTML. `localResourceRoots` is limited to `media/`.

**`src/bladeRenderer.ts`** — Pure regex rendering engine with a 5-pass pipeline:
1. Strip comments (`{{-- --}}`) and `@php` blocks
2. Process block directives (`@if`/`@foreach`/`@for`/`@while`/`@auth`/`@guest`/`@isset`/`@empty`) with nesting support via `_matchBalancedParens()` and `_findClosingDirective()` depth tracking
3. Process inline directives (`@csrf`, `@method`, `@extends`, `@section`, `@yield`, `@include`, `@component`, `@slot`, `@push`, `@stack`)
4. Resolve output expressions (`{{ }}`, `{!! !!}`) via `_renderExpression()` — handles `$var`, `$var ?? 'default'`, `config()`, `old()`, `session()`, `$var->prop`, `$var['key']`
5. Remove asset directives (`@vite`)

**`src/htmlBuilder.ts`** — Assembles the final webview HTML document:
- `extractCdnStyles()`/`extractCdnScripts()` — regex extraction of https:// URLs
- `stripResourceTags()` — removes link/script tags to prevent duplication
- `extractDocumentParts()` — splits rendered HTML into inline `<style>` blocks + body content; handles full documents and fragments
- `sanitizeUrl()` — validates URL protocol via `new URL()` constructor
- `buildPreviewHtml()` — final HTML with nonce-based CSP (`script-src 'nonce-...'`, no `unsafe-inline` for scripts)

**`media/preview.css`** — Styles for the `.blade-preview-warning-banner`.
**`media/welcome.css`** — Styles for the welcome screen shown when no Blade file is open.

**Build**: Webpack bundles `src/extension.ts` → `dist/extension.js` (CommonJS, Node target). `vscode` is externalized. TypeScript via `ts-loader`.

## Adding new Blade directive support

All directive processing is in `bladeRenderer.ts`. Use `_processSimpleBlock()` for new block directives, or add regex replacements in `_processInlineDirectives()` for inline ones. Block directives with conditions need balanced parenthesis handling — see `_processIfBlocks()` as the reference pattern.
