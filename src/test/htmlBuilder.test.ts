import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	extractCdnStyles,
	extractCdnScripts,
	stripResourceTags,
	extractDocumentParts,
	sanitizeUrl,
	generateNonce,
	buildPreviewHtml,
} from '../htmlBuilder';

const fakeWebview = {
	cspSource: 'vscode-webview://test',
	asWebviewUri: (u: vscode.Uri) => u,
} as unknown as vscode.Webview;

const fakeUri = { toString: () => 'preview.css' } as unknown as vscode.Uri;

suite('htmlBuilder', () => {
	test('extractCdnStyles dedupes', () => {
		const html = '<link href="https://a.com/x.css" rel="stylesheet"><link href="https://a.com/x.css" rel="stylesheet"><link href="https://b.com/y.css" rel="stylesheet">';
		assert.deepStrictEqual(extractCdnStyles(html), ['https://a.com/x.css', 'https://b.com/y.css']);
	});

	test('extractCdnScripts dedupes', () => {
		const html = '<script src="https://a.com/x.js"></script><script src="https://a.com/x.js"></script>';
		assert.deepStrictEqual(extractCdnScripts(html), ['https://a.com/x.js']);
	});

	test('stripResourceTags removes link/script', () => {
		const html = '<link rel="stylesheet" href="https://a/x.css"><script src="https://a/x.js"></script>keep';
		const out = stripResourceTags(html);
		assert.ok(!out.includes('<link'));
		assert.ok(!out.includes('<script'));
		assert.ok(out.includes('keep'));
	});

	test('extractDocumentParts handles full document', () => {
		const html = '<!DOCTYPE html><html><head><style>.a{}</style></head><body><p>Hi</p></body></html>';
		const { inlineStyles, bodyContent } = extractDocumentParts(html);
		assert.ok(inlineStyles.includes('.a{}'));
		assert.strictEqual(bodyContent.trim(), '<p>Hi</p>');
	});

	test('extractDocumentParts handles fragment', () => {
		const html = '<style>.b{}</style><div>Frag</div>';
		const { inlineStyles, bodyContent } = extractDocumentParts(html);
		assert.ok(inlineStyles.includes('.b{}'));
		assert.strictEqual(bodyContent.trim(), '<div>Frag</div>');
	});

	test('sanitizeUrl allows http(s)', () => {
		assert.strictEqual(sanitizeUrl('https://a.com/x'), 'https://a.com/x');
		assert.strictEqual(sanitizeUrl('http://a.com/x'), 'http://a.com/x');
	});

	test('sanitizeUrl rejects javascript:', () => {
		assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
	});

	test('sanitizeUrl rejects garbage', () => {
		assert.strictEqual(sanitizeUrl('not a url'), '');
	});

	test('generateNonce yields fresh hex value each call', () => {
		const a = generateNonce();
		const b = generateNonce();
		assert.notStrictEqual(a, b);
		assert.match(a, /^[a-f0-9]{32}$/);
	});

	test('buildPreviewHtml emits CSP with nonce and skips invalid CDN URLs', () => {
		const html = buildPreviewHtml({
			webview: fakeWebview,
			cdnStyles: ['https://good/x.css', 'javascript:bad'],
			cdnScripts: ['https://good/x.js', 'nope'],
			inlineStyles: '<style>.x{}</style>',
			bodyContent: '<p>body</p>',
			previewCssUri: fakeUri,
		});
		assert.match(html, /Content-Security-Policy/);
		assert.match(html, /script-src 'nonce-[a-f0-9]{32}'/);
		assert.ok(html.includes('https://good/x.css'));
		assert.ok(html.includes('https://good/x.js'));
		assert.ok(!html.includes('href=""'));
		assert.ok(!html.includes('src=""'));
		assert.ok(!html.includes('javascript:bad'));
		assert.ok(html.includes('<p>body</p>'));
		assert.ok(html.includes('<style>.x{}</style>'));
	});
});
