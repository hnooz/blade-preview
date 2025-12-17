<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Blade Preview VS Code Extension

A VS Code extension for previewing Laravel Blade templates as rendered HTML.

## Project Status: ✅ Complete

## Features

- **Blade Template Preview**: Real-time HTML preview of Laravel Blade templates
- **Auto-Update**: Preview refreshes automatically as you edit
- **Blade Directive Support**: Handles @if, @foreach, @extends, @section, @yield, @csrf, and more
- **Side-by-Side Editing**: Preview panel opens alongside the editor
- **Context Menu Integration**: Right-click to open preview
- **Editor Title Icon**: Quick preview access from title bar
- **CDN CSS/JS Loading**: Supports Bootstrap, Tailwind, and other CDN resources
- **Local CSS/JS Loading**: Loads CSS/JS from public/, resources/, and other Laravel directories
- **Laravel Helper Support**: Handles asset(), url(), public_path(), base_path(), resource_path(), mix(), and @vite()

## How to Use

1. Press `F5` to launch the extension in debug mode
2. In the Extension Development Host window, open a `.blade.php` file
3. Use Command Palette (`Cmd+Shift+P`) and run "Blade Preview: Open Preview"
4. Or click the preview icon in the editor title bar
5. Edit the Blade template and watch the preview update in real-time

## Project Structure

```
blade-preview/
├── src/
│   ├── extension.ts           # Extension activation and commands
│   ├── bladePreviewPanel.ts   # Webview panel and Blade rendering logic
│   └── test/                  # Extension tests
├── media/
│   ├── preview.css            # Preview styling
│   └── welcome.css            # Welcome screen styling
├── public/css/                # Example local CSS for testing
├── .vscode/                   # VS Code settings and launch config
├── dist/                      # Compiled extension output
├── example*.blade.php         # Sample Blade templates for testing
└── package.json               # Extension manifest
```

## Development Commands

- `npm run compile` - Compile the extension
- `npm run watch` - Watch mode for development
- `F5` - Launch extension in debug mode
