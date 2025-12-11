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
                    vscode.Uri.joinPath(extensionUri, 'out')
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

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:;">
    <title>Blade Preview</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .preview-container {
            width: 100%;
            height: 100%;
        }
        .error-message {
            padding: 20px;
            background-color: #fee;
            color: #c33;
            border-left: 4px solid #c33;
            margin: 20px;
        }
        .warning-banner {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="warning-banner">
        <strong>⚠️ Preview Mode:</strong> This is a simulated rendering of the Blade template. Actual Laravel rendering may differ.
    </div>
    <div class="preview-container">
        ${renderedHtml}
    </div>
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
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';">
    <title>Blade Preview</title>
    <style>
        body {
            padding: 40px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .welcome-container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
        }
        p {
            line-height: 1.6;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <h1>🔍 Blade Preview</h1>
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

            // Handle {{ }} - escaped output (show as text)
            html = html.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, content) => {
                return `<span style="color: #888; font-style: italic;">[${content.trim()}]</span>`;
            });

            // Handle {!! !!} - unescaped output (show as text)
            html = html.replace(/\{!!\s*(.+?)\s*!!\}/g, (match, content) => {
                return `<span style="color: #888; font-weight: bold;">[RAW: ${content.trim()}]</span>`;
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
