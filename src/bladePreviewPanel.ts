/**
 * Singleton webview panel that displays the Blade template preview.
 *
 * This file handles only VS Code lifecycle concerns:
 *  - Creating / revealing the webview panel
 *  - Responding to document changes and editor switches
 *  - Disposing resources
 *
 * Rendering logic lives in bladeRenderer.ts and htmlBuilder.ts.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { BladeRenderer } from './bladeRenderer';
import {
	extractCdnStyles,
	extractCdnScripts,
	stripResourceTags,
	extractDocumentParts,
	buildPreviewHtml,
	buildWelcomeHtml,
} from './htmlBuilder';

export class BladePreviewPanel {
	public static currentPanel: BladePreviewPanel | undefined;

	private static readonly VIEW_TYPE = 'bladePreview';
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _renderer = new BladeRenderer();
	private _disposables: vscode.Disposable[] = [];
	private _document: vscode.TextDocument | undefined;

	// ── Construction ────────────────────────────────────────────────

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		document?: vscode.TextDocument,
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._document = document;

		this._update();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.onDidChangeViewState(
			() => { if (this._panel.visible) { this._update(); } },
			null,
			this._disposables,
		);
	}

	public static createOrShow(extensionUri: vscode.Uri, document?: vscode.TextDocument): void {
		const column = vscode.window.activeTextEditor?.viewColumn;

		if (BladePreviewPanel.currentPanel) {
			BladePreviewPanel.currentPanel._panel.reveal(column);
			if (document) {
				BladePreviewPanel.currentPanel._document = document;
				BladePreviewPanel.currentPanel._update();
			}
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			BladePreviewPanel.VIEW_TYPE,
			'Blade Preview',
			column || vscode.ViewColumn.Two,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
				retainContextWhenHidden: true,
			},
		);

		BladePreviewPanel.currentPanel = new BladePreviewPanel(panel, extensionUri, document);
	}

	// ── Public API ──────────────────────────────────────────────────

	public updateContent(document: vscode.TextDocument): void {
		this._document = document;
		this._update();
	}

	public dispose(): void {
		BladePreviewPanel.currentPanel = undefined;
		this._panel.dispose();
		for (const d of this._disposables) { d.dispose(); }
		this._disposables = [];
	}

	// ── Private ─────────────────────────────────────────────────────

	private _update(): void {
		const webview = this._panel.webview;

		if (this._document) {
			this._panel.title = `Preview: ${path.basename(this._document.fileName)}`;
			webview.html = this._renderPreview(webview);
		} else {
			webview.html = this._renderWelcome(webview);
		}
	}

	private _renderPreview(webview: vscode.Webview): string {
		if (!this._document) { return this._renderWelcome(webview); }

		const raw = this._document.getText();

		// Extract CDN resources from the original source
		const cdnStyles = extractCdnStyles(raw);
		const cdnScripts = extractCdnScripts(raw);

		// Strip resource tags → render blade → split into styles + body
		const stripped = stripResourceTags(raw);
		const rendered = this._renderer.render(stripped);
		const { inlineStyles, bodyContent } = extractDocumentParts(rendered);

		const previewCssUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'preview.css'),
		);

		return buildPreviewHtml({
			webview,
			cdnStyles,
			cdnScripts,
			inlineStyles,
			bodyContent,
			previewCssUri,
		});
	}

	private _renderWelcome(webview: vscode.Webview): string {
		const welcomeCssUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'welcome.css'),
		);
		return buildWelcomeHtml(webview, welcomeCssUri);
	}
}
