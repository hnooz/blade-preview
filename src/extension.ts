import * as vscode from 'vscode';
import { BladePreviewPanel } from './bladePreviewPanel';

export function activate(context: vscode.ExtensionContext) {
	console.log('[Blade Preview] Extension is now active!');
	console.log('[Blade Preview] Extension path:', context.extensionUri.fsPath);

	// Register command to open preview
	const openPreviewCommand = vscode.commands.registerCommand('blade-preview.openPreview', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a Blade template file.');
			return;
		}

		const document = editor.document;
		if (!document.fileName.endsWith('.blade.php')) {
			vscode.window.showWarningMessage('This command works best with .blade.php files.');
		}

		BladePreviewPanel.createOrShow(context.extensionUri, document);
	});

	// Register command to open preview to the side
	const openPreviewToSideCommand = vscode.commands.registerCommand('blade-preview.openPreviewToSide', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found. Please open a Blade template file.');
			return;
		}

		const document = editor.document;
		if (!document.fileName.endsWith('.blade.php')) {
			vscode.window.showWarningMessage('This command works best with .blade.php files.');
		}

		BladePreviewPanel.createOrShow(context.extensionUri, document);
	});

	// Update preview when document changes
	const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
		if (BladePreviewPanel.currentPanel && e.document.fileName.endsWith('.blade.php')) {
			BladePreviewPanel.currentPanel.updateContent(e.document);
		}
	});

	// Update preview when switching editors
	const changeEditorSubscription = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (BladePreviewPanel.currentPanel && editor && editor.document.fileName.endsWith('.blade.php')) {
			BladePreviewPanel.currentPanel.updateContent(editor.document);
		}
	});

	context.subscriptions.push(
		openPreviewCommand,
		openPreviewToSideCommand,
		changeDocumentSubscription,
		changeEditorSubscription
	);
}

export function deactivate() {}
