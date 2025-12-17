# Change Log

All notable changes to the "blade-preview" extension will be documented in this file.

## [0.0.2] - 2025-12-16

### Added
- **Laravel Helper Function Support**: Full support for all Laravel asset helpers
  - `asset()`, `url()`, `public_path()`, `base_path()`, `resource_path()`
  - `@vite()` directive for Vite asset bundling
  - `mix()` helper for Laravel Mix versioning
- **Local CSS/JS Loading**: Automatically detects and loads local stylesheets and scripts
- **Intelligent Path Resolution**: Searches common Laravel directories (public/, resources/, node_modules/)
- **Debug Logging**: Enhanced console logging for troubleshooting asset loading
- External CSS files from CDN (Bootstrap, Tailwind, Font Awesome, etc.)
- Modular CSS architecture with separate preview and welcome screen styles

### Changed
- Improved Content Security Policy to allow HTTPS resources
- Enhanced regex patterns for better Blade directive detection
- Updated webview to support workspace folder resources

## [0.0.1] - 2025-12-11

### Added
- Initial release
- Real-time Blade template preview
- Support for common Blade directives (@if, @foreach, @extends, etc.)
- Blade variable rendering with styled indicators
- Side-by-side preview panel
- Auto-update on file changes
- Command palette and context menu integration