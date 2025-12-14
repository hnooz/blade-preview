# Blade Preview for VS Code

A VS Code extension that provides live preview of Laravel Blade templates as fully rendered HTML designs.

## Features

- **Live Preview**: Preview your Blade templates in real-time as you edit
- **Local CSS/JS Support**: Automatically detects and loads local CSS and JavaScript files from your Laravel project
- **CDN Support**: Automatically loads CSS and JavaScript from CDN links (Bootstrap, Tailwind, Font Awesome, etc.)
- **Laravel Asset Helpers**: Supports `asset()`, `@vite()` directives for loading local resources
- **Multiple Path Resolution**: Searches common Laravel directories (public/, resources/, node_modules/)
- **External Stylesheets**: Detects and loads external CSS files referenced in your Blade templates
- **Modular Styling**: Uses separate CSS files for clean, maintainable preview styles
- **Syntax Processing**: Handles common Blade directives including:
  - Control structures (`@if`, `@foreach`, `@while`, etc.)
  - Template inheritance (`@extends`, `@section`, `@yield`)
  - Components (`@component`, `@slot`)
  - Forms (`@csrf`, `@method`)
  - And more!
- **Side-by-Side View**: Open preview alongside your editor
- **Auto-Update**: Preview updates automatically as you type
- **Visual Indicators**: Shows Blade variables and directives clearly in the preview

## Usage

### Opening the Preview

There are several ways to open the Blade preview:

1. **Command Palette**: 
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Blade Preview: Open Preview"

2. **Editor Title Bar**: 
   - Click the preview icon in the editor title bar when viewing a `.blade.php` file

3. **Context Menu**: 
   - Right-click in a `.blade.php` file
   - Select "Blade Preview: Open Preview"

### Preview Features

- The preview updates automatically as you edit your Blade template
- Blade variables are shown with styled badges: `[variable_name]`
- Raw output is highlighted: `[RAW: content]`
- Blade directives are converted to HTML comments for debugging
- **Local CSS/JS files** from your Laravel project are automatically loaded
- **CDN resources** (CSS/JS) from popular libraries are automatically loaded:
  - Bootstrap
  - Tailwind CSS
  - Font Awesome
  - jQuery
  - And any other CDN-hosted resources

### Local File Resolution

The extension automatically searches for local CSS and JavaScript files in common Laravel directories:
- `public/css/`, `public/js/`
- `public/build/` (Vite builds)
- `resources/css/`, `resources/js/`
- `node_modules/`
## Examples

The extension includes example files:
- `example.blade.php` - Basic Blade template
- `example-bootstrap.blade.php` - Bootstrap 5 template with CDN resources
- `example-local-css.blade.php` - Template using local CSS files from `public/css/app.css`

### Supported CDN Providers

- jsDelivr (`cdn.jsdelivr.net`)
- unpkg (`unpkg.com`)
- cdnjs (`cdnjs.cloudflare.com`)
- StackPath (`stackpath.bootstrapcdn.com`)
- Google Fonts (`fonts.googleapis.com`)

## Examples

The extension includes example files:
- `example.blade.php` - Basic Blade template
- `example-bootstrap.blade.php` - Bootstrap 5 template with CDN resources

## Important Notes

⚠️ **Preview Limitations**: 
- This extension provides a **simulated rendering** of Blade templates
- It does not execute PHP code or connect to a Laravel backend
- Dynamic content (variables, loops, conditionals) is shown as placeholders
- Actual rendering in Laravel may differ based on your data and logic

For full Laravel rendering with actual data, you'll need to run your Laravel application.

## Requirements

- VS Code 1.107.0 or higher
- Files should have the `.blade.php` extension for best results

## Extension Settings

This extension does not currently add any VS Code settings.

## Known Issues

- Template inheritance (`@extends`) shows only comments, not actual parent content
- Included files (`@include`) are not loaded
- PHP code blocks are hidden in the preview
- Complex Blade expressions may not render perfectly

## Release Notes

### 0.0.1

Initial release:
- Basic Blade template preview
- Support for common Blade directives
- Auto-updating preview
- Side-by-side editing

---

## For Developers

### Running the Extension

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new VS Code window with the extension loaded
4. Open a `.blade.php` file and use the preview command

### Building

```bash
npm run compile
```

### Packaging

```bash
npm run package
```

**Enjoy previewing your Blade templates!** 🚀
