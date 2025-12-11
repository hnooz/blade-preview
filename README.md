# Blade Preview for VS Code

A VS Code extension that provides live preview of Laravel Blade templates as fully rendered HTML designs.

## Features

- **Live Preview**: Preview your Blade templates in real-time as you edit
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
- Blade variables are shown in a styled format: `[variable_name]`
- Raw output is indicated: `[RAW: content]`
- Blade directives are converted to HTML comments for debugging

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
