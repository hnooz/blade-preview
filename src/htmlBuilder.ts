/**
 * Builds the final HTML document for the webview preview.
 *
 * Responsibilities:
 *  - Extract CDN stylesheet/script URLs from raw blade source
 *  - Strip resource tags to prevent duplication
 *  - Extract inline <style> blocks and <body> content from rendered HTML
 *  - Assemble the final HTML with CSP, nonce, and preview chrome
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';

/** Result of splitting rendered HTML into hoistable styles and body content. */
interface DocumentParts {
	inlineStyles: string;
	bodyContent: string;
}

/**
 * Generate a cryptographic nonce for CSP script-src.
 */
export function generateNonce(): string {
	return crypto.randomBytes(16).toString('hex');
}

/**
 * Extract all unique URLs matching `pattern` from `content`.
 * The pattern must have a capture group for the URL.
 */
export function extractCdnUrls(content: string, pattern: RegExp): string[] {
	const urls: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = pattern.exec(content)) !== null) {
		if (!urls.includes(m[1])) { urls.push(m[1]); }
	}
	return urls;
}

/**
 * Extract CDN stylesheet URLs from raw blade content.
 */
export function extractCdnStyles(content: string): string[] {
	return extractCdnUrls(content, /<link[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi);
}

/**
 * Extract CDN script URLs from raw blade content.
 */
export function extractCdnScripts(content: string): string[] {
	return extractCdnUrls(content, /<script[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi);
}

/**
 * Remove <link rel="stylesheet"> and <script src="..."> tags
 * so they aren't duplicated when we re-inject them in <head>.
 */
export function stripResourceTags(html: string): string {
	html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
	html = html.replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');
	return html;
}

/**
 * Split rendered HTML into inline <style> blocks (to hoist into <head>)
 * and the effective body content. Handles both full HTML documents and fragments.
 */
export function extractDocumentParts(html: string): DocumentParts {
	// Collect all <style> blocks
	const styleBlocks: string[] = [];
	const styleRe = /<style[\s\S]*?<\/style>/gi;
	let m: RegExpExecArray | null;
	while ((m = styleRe.exec(html)) !== null) {
		styleBlocks.push(m[0]);
	}
	const inlineStyles = styleBlocks.join('\n');

	// Remove <style> blocks from the HTML
	let cleaned = html.replace(/<style[\s\S]*?<\/style>/gi, '');

	// If full document, extract only <body> content
	const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
	if (bodyMatch) {
		return { inlineStyles, bodyContent: bodyMatch[1] };
	}

	// Fragment — strip any remaining document scaffolding
	cleaned = cleaned
		.replace(/<!DOCTYPE[^>]*>/gi, '')
		.replace(/<\/?html[^>]*>/gi, '')
		.replace(/<head[\s\S]*?<\/head>/gi, '')
		.trim();

	return { inlineStyles, bodyContent: cleaned };
}

/**
 * Validate a URL is http(s) before injecting into HTML attributes.
 */
export function sanitizeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return '';
		}
		return url;
	} catch {
		return '';
	}
}

/**
 * Build the full preview HTML document.
 */
export function buildPreviewHtml(options: {
	webview: vscode.Webview;
	cdnStyles: string[];
	cdnScripts: string[];
	inlineStyles: string;
	bodyContent: string;
	previewCssUri: vscode.Uri;
}): string {
	const { webview, cdnStyles, cdnScripts, inlineStyles, bodyContent, previewCssUri } = options;
	const nonce = generateNonce();

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https:; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource} https: data:;">
    <title>Blade Preview</title>
    ${cdnStyles.map(url => `<link rel="stylesheet" href="${sanitizeUrl(url)}">`).join('\n    ')}
    ${inlineStyles}
    <link rel="stylesheet" href="${previewCssUri}">
</head>
<body>
    <div class="blade-preview-warning-banner">
        <strong>&#9888; Preview Mode:</strong> Simulated rendering &mdash; not actual Laravel output
    </div>
    ${bodyContent}
    ${cdnScripts.map(url => `<script nonce="${nonce}" src="${sanitizeUrl(url)}"></script>`).join('\n    ')}
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        window.addEventListener('error', (e) => {
            vscode.postMessage({ command: 'alert', text: 'Preview error: ' + e.message });
        });
    </script>
</body>
</html>`;
}

/**
 * Build the welcome HTML shown when no blade file is open.
 */
export function buildWelcomeHtml(webview: vscode.Webview, welcomeCssUri: vscode.Uri): string {
	const nonce = generateNonce();

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Blade Preview</title>
    <link rel="stylesheet" href="${welcomeCssUri}">
</head>
<body>
    <div class="welcome-container">
        <div class="icon">\uD83D\uDD0D</div>
        <h1>Blade Preview</h1>
        <p>Open a Laravel Blade template (.blade.php) and use the command "Blade Preview: Open Preview" to see a rendered preview.</p>
        <p>The preview will update automatically as you edit the template.</p>
    </div>
</body>
</html>`;
}
