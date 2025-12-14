import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class BladePreviewPanel {
    public static currentPanel: BladePreviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _document: vscode.TextDocument | undefined;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document?: vscode.TextDocument) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._document = document;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, document?: vscode.TextDocument) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (BladePreviewPanel.currentPanel) {
            BladePreviewPanel.currentPanel._panel.reveal(column);
            if (document) {
                BladePreviewPanel.currentPanel._document = document;
                BladePreviewPanel.currentPanel._update();
            }
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'bladePreview',
            'Blade Preview',
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    ...(vscode.workspace.workspaceFolders || []).map(folder => folder.uri)
                ],
                retainContextWhenHidden: true
            }
        );

        BladePreviewPanel.currentPanel = new BladePreviewPanel(panel, extensionUri, document);
    }

    public updateContent(document: vscode.TextDocument) {
        this._document = document;
        this._update();
    }

    private _update() {
        const webview = this._panel.webview;

        if (this._document) {
            this._panel.title = `Preview: ${path.basename(this._document.fileName)}`;
            this._panel.webview.html = this._getHtmlForWebview(webview);
        } else {
            this._panel.webview.html = this._getWelcomeHtml(webview);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        if (!this._document) {
            return this._getWelcomeHtml(webview);
        }

        const bladeContent = this._document.getText();
        const renderedHtml = this._renderBladeTemplate(bladeContent);
        
        // Get CSS and script URIs
        const styleUri = this._getStyleUri(webview);
        const externalStyles = this._extractExternalStyles(bladeContent);
        const localStyles = this._extractLocalStyles(bladeContent, webview);
        const externalScripts = this._extractExternalScripts(bladeContent);
        const localScripts = this._extractLocalScripts(bladeContent, webview);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https:; script-src ${webview.cspSource} 'unsafe-inline' https:; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource} https: data:;">
    <title>Blade Preview</title>
    ${externalStyles.map(url => `<link rel="stylesheet" href="${url}">`).join('\n    ')}
    ${localStyles.map(url => `<link rel="stylesheet" href="${url}">`).join('\n    ')}
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div class="warning-banner">
        <strong>⚠️ Preview Mode:</strong> This is a simulated rendering of the Blade template. Actual Laravel rendering may differ.
    </div>
    <div class="preview-container">
        ${renderedHtml}
    </div>
    ${externalScripts.map(url => `<script src="${url}"></script>`).join('\n    ')}
    ${localScripts.map(url => `<script src="${url}"></script>`).join('\n    ')}
    <script>
        const vscode = acquireVsCodeApi();
        
        // Handle any errors in the preview
        window.addEventListener('error', (e) => {
            vscode.postMessage({
                command: 'alert',
                text: 'Error in preview: ' + e.message
            });
        });
    </script>
</body>
</html>`;
    }

    private _getWelcomeHtml(webview: vscode.Webview): string {
        const welcomeStyleUri = this._getWelcomeStyleUri(webview);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';">
    <title>Blade Preview</title>
    <link rel="stylesheet" href="${welcomeStyleUri}">
</head>
<body>
    <div class="welcome-container">
        <div class="icon">🔍</div>
        <h1>Blade Preview</h1>
        <p>Open a Laravel Blade template (.blade.php) and use the command "Blade Preview: Open Preview" to see a rendered preview.</p>
        <p>The preview will update automatically as you edit the template.</p>
    </div>
</body>
</html>`;
    }

    private _renderBladeTemplate(bladeContent: string): string {
        try {
            // Basic Blade syntax processing
            let html = bladeContent;

            // Handle @extends
            html = html.replace(/@extends\(['"](.+?)['"]\)/g, '<!-- extends: $1 -->');

            // Handle @section and @endsection
            html = html.replace(/@section\(['"](.+?)['"]\)/g, '<!-- section: $1 -->');
            html = html.replace(/@endsection/g, '<!-- end section -->');

            // Handle @yield
            html = html.replace(/@yield\(['"](.+?)['"](?:,\s*['"](.+?)['"]\))?\)/g, (match, name, defaultContent) => {
                return defaultContent ? `<div data-section="${name}">${defaultContent}</div>` : `<div data-section="${name}"><!-- yield: ${name} --></div>`;
            });

            // Handle @if, @elseif, @else, @endif - show content
            html = html.replace(/@if\s*\((.+?)\)/g, '<!-- if: $1 -->');
            html = html.replace(/@elseif\s*\((.+?)\)/g, '<!-- elseif: $1 -->');
            html = html.replace(/@else/g, '<!-- else -->');
            html = html.replace(/@endif/g, '<!-- endif -->');

            // Handle @foreach, @endforeach
            html = html.replace(/@foreach\s*\((.+?)\)/g, '<!-- foreach: $1 -->');
            html = html.replace(/@endforeach/g, '<!-- endforeach -->');

            // Handle @for, @endfor
            html = html.replace(/@for\s*\((.+?)\)/g, '<!-- for: $1 -->');
            html = html.replace(/@endfor/g, '<!-- endfor -->');

            // Handle @while, @endwhile
            html = html.replace(/@while\s*\((.+?)\)/g, '<!-- while: $1 -->');
            html = html.replace(/@endwhile/g, '<!-- endwhile -->');

            // Handle @include
            html = html.replace(/@include\(['"](.+?)['"]\)/g, '<!-- include: $1 -->');

            // Handle @component and @endcomponent
            html = html.replace(/@component\(['"](.+?)['"]\)/g, '<!-- component: $1 -->');
            html = html.replace(/@endcomponent/g, '<!-- end component -->');

            // Handle @slot and @endslot
            html = html.replace(/@slot\(['"](.+?)['"]\)/g, '<!-- slot: $1 -->');
            html = html.replace(/@endslot/g, '<!-- end slot -->');

            // Handle @push and @endpush
            html = html.replace(/@push\(['"](.+?)['"]\)/g, '<!-- push: $1 -->');
            html = html.replace(/@endpush/g, '<!-- end push -->');

            // Handle @stack
            html = html.replace(/@stack\(['"](.+?)['"]\)/g, '<!-- stack: $1 -->');

            // Handle @csrf and @method
            html = html.replace(/@csrf/g, '<input type="hidden" name="_token" value="PREVIEW_TOKEN">');
            html = html.replace(/@method\(['"](.+?)['"]\)/g, '<input type="hidden" name="_method" value="$1">');

            // Handle Blade comments
            html = html.replace(/\{\{--.*?--\}\}/gs, '');

            // Handle {{ }} - escaped output (show as text with styling)
            html = html.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, content) => {
                return `<span class="blade-variable">[${content.trim()}]</span>`;
            });

            // Handle {!! !!} - unescaped output (show as text with styling)
            html = html.replace(/\{!!\s*(.+?)\s*!!\}/g, (match, content) => {
                return `<span class="blade-raw">[RAW: ${content.trim()}]</span>`;
            });

            // Handle @php and @endphp
            html = html.replace(/@php([\s\S]*?)@endphp/g, '<!-- PHP code block -->');

            // Handle common single-line directives
            html = html.replace(/@auth/g, '<!-- auth -->');
            html = html.replace(/@endauth/g, '<!-- endauth -->');
            html = html.replace(/@guest/g, '<!-- guest -->');
            html = html.replace(/@endguest/g, '<!-- endguest -->');
            html = html.replace(/@isset\s*\((.+?)\)/g, '<!-- isset: $1 -->');
            html = html.replace(/@endisset/g, '<!-- endisset -->');
            html = html.replace(/@empty\s*\((.+?)\)/g, '<!-- empty: $1 -->');
            html = html.replace(/@endempty/g, '<!-- endempty -->');

            return html;
        } catch (error) {
            return `<div class="error-message">
                <strong>Error rendering Blade template:</strong><br>
                ${error instanceof Error ? error.message : 'Unknown error'}
            </div>`;
        }
    }

    private _getStyleUri(webview: vscode.Webview): vscode.Uri {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'preview.css')
        );
        return styleUri;
    }

    private _getWelcomeStyleUri(webview: vscode.Webview): vscode.Uri {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'welcome.css')
        );
        return styleUri;
    }

    private _extractExternalStyles(bladeContent: string): string[] {
        const styles: string[] = [];
        
        // Extract CDN links from <link> tags
        const linkRegex = /<link[^>]*href=["'](https?:\/\/[^"']+\.css[^"']*)["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(bladeContent)) !== null) {
            styles.push(match[1]);
        }

        // Common CDN patterns (Bootstrap, Tailwind, etc.)
        const cdnPatterns = [
            /https?:\/\/cdn\.jsdelivr\.net\/[^\s"'<>]+\.css/gi,
            /https?:\/\/unpkg\.com\/[^\s"'<>]+\.css/gi,
            /https?:\/\/cdnjs\.cloudflare\.com\/[^\s"'<>]+\.css/gi,
            /https?:\/\/stackpath\.bootstrapcdn\.com\/[^\s"'<>]+\.css/gi,
            /https?:\/\/fonts\.googleapis\.com\/css[^\s"'<>]*/gi
        ];

        cdnPatterns.forEach(pattern => {
            let cdnMatch;
            while ((cdnMatch = pattern.exec(bladeContent)) !== null) {
                const url = cdnMatch[0];
                if (!styles.includes(url)) {
                    styles.push(url);
                }
            }
        });

        return styles;
    }

    private _extractExternalScripts(bladeContent: string): string[] {
        const scripts: string[] = [];
        
        // Extract CDN scripts from <script> tags
        const scriptRegex = /<script[^>]*src=["'](https?:\/\/[^"']+\.js[^"']*)["'][^>]*>/gi;
        let match;
        while ((match = scriptRegex.exec(bladeContent)) !== null) {
            scripts.push(match[1]);
        }

        // Common CDN patterns
        const cdnPatterns = [
            /https?:\/\/cdn\.jsdelivr\.net\/[^\s"'<>]+\.js/gi,
            /https?:\/\/unpkg\.com\/[^\s"'<>]+\.js/gi,
            /https?:\/\/cdnjs\.cloudflare\.com\/[^\s"'<>]+\.js/gi
        ];

        cdnPatterns.forEach(pattern => {
            let cdnMatch;
            while ((cdnMatch = pattern.exec(bladeContent)) !== null) {
                const url = cdnMatch[0];
                if (!scripts.includes(url)) {
                    scripts.push(url);
                }
            }
        });

        return scripts;
    }

    private _extractLocalStyles(bladeContent: string, webview: vscode.Webview): string[] {
        const styles: string[] = [];
        
        if (!this._document) {
            return styles;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._document.uri);
        if (!workspaceFolder) {
            console.log('[Blade Preview] No workspace folder found');
            return styles;
        }

        console.log('[Blade Preview] Searching for local CSS in:', workspaceFolder.uri.fsPath);

        // Extract relative/absolute paths from <link> tags (non-http URLs)
        const linkRegex = /<link[^>]*href=["'](?!https?:\/\/)([^"']+\.css)["'][^>]*>/gi;
        let match;
        
        while ((match = linkRegex.exec(bladeContent)) !== null) {
            const relativePath = match[1];
            console.log('[Blade Preview] Found local CSS reference:', relativePath);
            const resolvedUri = this._resolveLocalResource(relativePath, workspaceFolder, webview);
            if (resolvedUri) {
                console.log('[Blade Preview] Resolved to:', resolvedUri);
                styles.push(resolvedUri);
            } else {
                console.log('[Blade Preview] Could not resolve:', relativePath);
            }
        }

        // Also check for common Laravel asset patterns
        const assetPatterns = [
            /@vite\(['"]([^'"]+\.css)['"]\)/gi,
            /asset\(['"]([^'"]+\.css)['"]\)/gi,
            /{{ asset\(['"]([^'"]+\.css)['"]\) }}/gi,
        ];

        assetPatterns.forEach(pattern => {
            let assetMatch;
            while ((assetMatch = pattern.exec(bladeContent)) !== null) {
                const assetPath = assetMatch[1];
                const resolvedUri = this._resolveLocalResource(assetPath, workspaceFolder, webview);
                if (resolvedUri) {
                    styles.push(resolvedUri);
                }
            }
        });

        return styles;
    }

    private _extractLocalScripts(bladeContent: string, webview: vscode.Webview): string[] {
        const scripts: string[] = [];
        
        if (!this._document) {
            return scripts;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(this._document.uri);
        if (!workspaceFolder) {
            return scripts;
        }

        // Extract relative/absolute paths from <script> tags
        const scriptRegex = /<script[^>]*src=["'](?!https?:\/\/)([^"']+\.js)["'][^>]*>/gi;
        let match;
        
        while ((match = scriptRegex.exec(bladeContent)) !== null) {
            const relativePath = match[1];
            const resolvedUri = this._resolveLocalResource(relativePath, workspaceFolder, webview);
            if (resolvedUri) {
                scripts.push(resolvedUri);
            }
        }

        // Also check for Laravel asset patterns
        const assetPatterns = [
            /@vite\(['"]([^'"]+\.js)['"]\)/gi,
            /asset\(['"]([^'"]+\.js)['"]\)/gi,
            /{{ asset\(['"]([^'"]+\.js)['"]\) }}/gi,
        ];

        assetPatterns.forEach(pattern => {
            let assetMatch;
            while ((assetMatch = pattern.exec(bladeContent)) !== null) {
                const assetPath = assetMatch[1];
                const resolvedUri = this._resolveLocalResource(assetPath, workspaceFolder, webview);
                if (resolvedUri) {
                    scripts.push(resolvedUri);
                }
            }
        });

        return scripts;
    }

    private _resolveLocalResource(
        resourcePath: string, 
        workspaceFolder: vscode.WorkspaceFolder, 
        webview: vscode.Webview
    ): string | null {
        // Remove leading slash or ./
        let cleanPath = resourcePath.replace(/^\.?\//, '');

        console.log('[Blade Preview] Resolving resource:', resourcePath, '-> cleaned:', cleanPath);

        // Common Laravel public asset paths
        const commonPaths = [
            cleanPath,                                    // As-is
            path.join('public', cleanPath),               // public/css/app.css
            path.join('resources', cleanPath),            // resources/css/app.css
            path.join('resources', 'css', cleanPath),     // resources/css/...
            path.join('resources', 'js', cleanPath),      // resources/js/...
            path.join('node_modules', cleanPath),         // node_modules/...
            path.join('public', 'build', cleanPath),      // public/build/... (Vite)
        ];

        for (const testPath of commonPaths) {
            try {
                const fullPath = path.join(workspaceFolder.uri.fsPath, testPath);
                console.log('[Blade Preview] Testing path:', fullPath);
                if (fs.existsSync(fullPath)) {
                    const fileUri = vscode.Uri.file(fullPath);
                    const webviewUri = webview.asWebviewUri(fileUri).toString();
                    console.log('[Blade Preview] ✓ Found file! Webview URI:', webviewUri);
                    return webviewUri;
                }
            } catch (error) {
                console.log('[Blade Preview] Error checking path:', testPath, error);
                continue;
            }
        }

        console.log('[Blade Preview] ✗ File not found in any common path');
        return null;
    }

    public dispose() {
        BladePreviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
