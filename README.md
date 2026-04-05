# Blade Preview

Live preview of Laravel Blade templates directly in VS Code. See your designs instantly without running a server.

## Features

- **Live Preview** — Preview updates automatically as you edit
- **CDN Support** — Automatically loads Bootstrap, Tailwind, Font Awesome, and other CDN resources referenced in your templates
- **Blade Directives** — Processes `@if`, `@foreach`, `@for`, `@while`, `@auth`, `@guest`, `@isset`, `@empty`, and more
- **Expression Rendering** — Handles `{{ $var }}`, `{!! $var !!}`, null coalesce defaults (`{{ $title ?? 'Default' }}`), `config()`, `old()`, `session()`
- **Template Inheritance** — Handles `@extends`, `@section`, `@yield`, `@include`, `@component`, `@slot`
- **Form Helpers** — `@csrf` and `@method` rendered as hidden inputs
- **Side-by-Side** — Preview opens alongside your editor
- **Secure** — CSP-protected webview with nonce-based script execution

## Usage

1. Open a `.blade.php` file
2. Open the preview:
   - **Command Palette**: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux) then type "Blade Preview: Open Preview"
   - **Editor title bar**: Click the preview icon when viewing a `.blade.php` file
   - **Context menu**: Right-click in a `.blade.php` file and select "Blade Preview: Open Preview"
3. Edit the template — the preview updates in real time

## Supported CDN Providers

CSS and JavaScript from these CDNs are automatically loaded in the preview:

- jsDelivr (`cdn.jsdelivr.net`)
- unpkg (`unpkg.com`)
- cdnjs (`cdnjs.cloudflare.com`)
- StackPath (`stackpath.bootstrapcdn.com`)
- Google Fonts (`fonts.googleapis.com`)

## Preview Limitations

This extension provides a **simulated rendering** of Blade templates:

- Does not execute PHP or connect to a Laravel backend
- Dynamic content (variables, loops, conditionals) is shown as placeholder text
- `@extends` / `@include` do not pull in parent or partial files
- Local CSS/JS file loading is not yet supported (CDN resources work)

For full rendering with actual data, run your Laravel application.

## Requirements

- VS Code 1.85.0 or higher

## License

[MIT](LICENSE)
