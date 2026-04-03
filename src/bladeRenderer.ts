/**
 * Transforms raw Blade template source into preview-safe HTML.
 *
 * Uses a multi-pass pipeline:
 *  1. Strip comments & PHP blocks
 *  2. Process block directives (@if, @foreach, etc.)
 *  3. Process inline directives (@csrf, @extends, etc.)
 *  4. Resolve output expressions ({{ }}, {!! !!})
 *  5. Clean up asset directives (@vite)
 */

const MAX_NESTING_ITERATIONS = 20;

export class BladeRenderer {

	render(source: string): string {
		let html = source;
		try {
			html = this._removeComments(html);
			html = this._removePhpBlocks(html);
			html = this._processBlockDirectives(html);
			html = this._processInlineDirectives(html);
			html = this._resolveOutputExpressions(html);
			html = this._removeAssetDirectives(html);
		} catch {
			// Return partially-processed HTML rather than crashing the preview
		}
		return html;
	}

	// ── Pass 1: Strip comments & PHP ────────────────────────────────

	private _removeComments(html: string): string {
		return html.replace(/\{\{--[\s\S]*?--\}\}/g, '');
	}

	private _removePhpBlocks(html: string): string {
		return html.replace(/@php[\s\S]*?@endphp/g, '');
	}

	// ── Pass 2: Block directives ────────────────────────────────────

	private _processBlockDirectives(html: string): string {
		let prev = '';
		let iterations = 0;
		while (prev !== html && iterations < MAX_NESTING_ITERATIONS) {
			prev = html;
			html = this._processIfBlocks(html);
			html = this._processLoopBlocks(html, 'foreach', 'endforeach');
			html = this._processLoopBlocks(html, 'for', 'endfor');
			html = this._processLoopBlocks(html, 'while', 'endwhile');
			html = this._processSimpleBlock(html, 'auth', 'endauth');
			html = this._processSimpleBlock(html, 'guest', 'endguest');
			html = this._processSimpleBlock(html, 'isset', 'endisset');
			html = this._processSimpleBlock(html, 'empty', 'endempty');
			iterations++;
		}
		return html;
	}

	private _processIfBlocks(html: string): string {
		const result: string[] = [];
		let lastIndex = 0;
		const re = /@if\s*\(/g;
		let m: RegExpExecArray | null;

		while ((m = re.exec(html)) !== null) {
			const parenOpen = m.index + m[0].length - 1;
			const balanced = this._matchBalancedParens(html, parenOpen);
			if (!balanced) { continue; }
			const [, afterParen] = balanced;

			const endifStart = this._findClosingDirective(html, afterParen, 'if', 'endif');
			if (endifStart === -1) { continue; }

			const body = html.slice(afterParen, endifStart);
			const endifEnd = endifStart + '@endif'.length;

			result.push(html.slice(lastIndex, m.index));
			result.push(this._extractIfBranches(body));
			lastIndex = endifEnd;
			re.lastIndex = endifEnd;
		}
		result.push(html.slice(lastIndex));
		return result.join('');
	}

	private _extractIfBranches(body: string): string {
		const splitPoints: { index: number; length: number }[] = [];

		const elseifRe = /@elseif\s*\(.+?\)/g;
		const elseRe = /@else(?!if)/g;
		let m: RegExpExecArray | null;

		while ((m = elseifRe.exec(body)) !== null) {
			splitPoints.push({ index: m.index, length: m[0].length });
		}
		while ((m = elseRe.exec(body)) !== null) {
			splitPoints.push({ index: m.index, length: m[0].length });
		}
		splitPoints.sort((a, b) => a.index - b.index);

		if (splitPoints.length === 0) { return body; }

		const parts: string[] = [body.substring(0, splitPoints[0].index)];
		for (let i = 0; i < splitPoints.length; i++) {
			const start = splitPoints[i].index + splitPoints[i].length;
			const end = i + 1 < splitPoints.length ? splitPoints[i + 1].index : body.length;
			parts.push(body.substring(start, end));
		}
		return parts.join('\n');
	}

	private _processLoopBlocks(html: string, open: string, close: string): string {
		const result: string[] = [];
		let lastIndex = 0;
		const re = new RegExp(`@${open}\\s*\\(`, 'g');
		let m: RegExpExecArray | null;

		while ((m = re.exec(html)) !== null) {
			const parenOpen = m.index + m[0].length - 1;
			const balanced = this._matchBalancedParens(html, parenOpen);
			if (!balanced) { continue; }
			const [, afterParen] = balanced;

			const endStart = this._findClosingDirective(html, afterParen, open, close);
			if (endStart === -1) { continue; }

			const body = html.slice(afterParen, endStart);
			const endEnd = endStart + `@${close}`.length;

			result.push(html.slice(lastIndex, m.index));
			result.push(body);
			lastIndex = endEnd;
			re.lastIndex = endEnd;
		}
		result.push(html.slice(lastIndex));
		return result.join('');
	}

	private _processSimpleBlock(html: string, open: string, close: string): string {
		const openRe = new RegExp(`@${open}(?:\\s*\\([^)]*\\))?`, 'g');
		const closeRe = new RegExp(`@${close}`, 'g');
		const result: string[] = [];
		let lastIndex = 0;
		let m: RegExpExecArray | null;

		while ((m = openRe.exec(html)) !== null) {
			const afterOpen = m.index + m[0].length;
			closeRe.lastIndex = afterOpen;
			const cm = closeRe.exec(html);
			if (!cm) { continue; }

			result.push(html.slice(lastIndex, m.index));
			result.push(html.slice(afterOpen, cm.index));
			lastIndex = cm.index + cm[0].length;
			openRe.lastIndex = lastIndex;
		}
		result.push(html.slice(lastIndex));
		return result.join('');
	}

	// ── Pass 3: Inline directives ───────────────────────────────────

	private _processInlineDirectives(html: string): string {
		// Form tokens
		html = html.replace(/@csrf/g, '<input type="hidden" name="_token" value="preview">');
		html = html.replace(/@method\(\s*['"](.+?)['"]\s*\)/g, '<input type="hidden" name="_method" value="$1">');

		// Template inheritance
		html = html.replace(/@extends\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@section\(\s*['"](.+?)['"]\s*(?:,\s*['"](.+?)['"]\s*)?\)/g, '');
		html = html.replace(/@endsection/g, '');
		html = html.replace(/@yield\(\s*['"](.+?)['"]\s*(?:,\s*['"](.+?)['"]\s*)?\)/g,
			(_m: string, _name: string, def: string | undefined) => def || '');

		// Includes, stacks, components
		html = html.replace(/@include\(\s*['"](.+?)['"]\s*(?:,\s*(\[[\s\S]*?\]))?\s*\)/g, '');
		html = html.replace(/@push\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@endpush/g, '');
		html = html.replace(/@stack\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@component\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@endcomponent/g, '');
		html = html.replace(/@slot\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@endslot/g, '');

		return html;
	}

	// ── Pass 4: Output expressions {{ }} and {!! !!} ────────────────

	private _resolveOutputExpressions(html: string): string {
		// Raw output {!! !!}
		html = html.replace(/\{!!\s*(.+?)\s*!!\}/g, (_match, expr: string) => {
			return this._renderExpression(expr.trim());
		});
		// Escaped output {{ }}
		html = html.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (_match, expr: string) => {
			return this._renderExpression(expr.trim());
		});
		return html;
	}

	private _renderExpression(expr: string): string {
		// Laravel helpers → empty in preview
		if (/^old\s*\(/.test(expr)) { return ''; }
		if (/^session\s*\(/.test(expr)) { return ''; }

		// config('key', 'default') → default value
		const cfgDefault = expr.match(/^config\s*\(\s*['"](.+?)['"]\s*,\s*['"](.+?)['"]\s*\)$/);
		if (cfgDefault) { return this._escapeHtml(cfgDefault[2]); }

		// config('key') → last segment
		const cfgKey = expr.match(/^config\s*\(\s*['"](.+?)['"]\s*\)$/);
		if (cfgKey) {
			const parts = cfgKey[1].split('.');
			return this._escapeHtml(parts[parts.length - 1]);
		}

		// $var ?? 'default' or $var ?? "default"
		const coalesceStr = expr.match(/^.+?\?\?\s*(['"])(.*?)\1\s*$/);
		if (coalesceStr) { return this._escapeHtml(coalesceStr[2]); }

		// $var ?? number
		const coalesceNum = expr.match(/^.+?\?\?\s*(\d+)\s*$/);
		if (coalesceNum) { return coalesceNum[1]; }

		// $var->prop
		const arrow = expr.match(/^\$\w+->(\w+)$/);
		if (arrow) { return this._escapeHtml(arrow[1]); }

		// $var['key']
		const bracket = expr.match(/^\$\w+\[\s*'(\w+)'\s*\]$/);
		if (bracket) { return this._escapeHtml(bracket[1]); }

		// $var
		const simple = expr.match(/^\$(\w+)$/);
		if (simple) { return this._escapeHtml(simple[1]); }

		return this._escapeHtml(expr);
	}

	// ── Pass 5: Asset directives ────────────────────────────────────

	private _removeAssetDirectives(html: string): string {
		html = html.replace(/@vite\s*\(\s*['"](.+?)['"]\s*\)/g, '');
		html = html.replace(/@vite\s*\(\s*\[[\s\S]*?\]\s*\)/g, '');
		return html;
	}

	// ── Shared helpers ──────────────────────────────────────────────

	/**
	 * Match balanced parentheses starting at the `(` at position `openAt`.
	 * Returns [content_inside, index_after_close_paren] or null.
	 */
	private _matchBalancedParens(str: string, openAt: number): [string, number] | null {
		let depth = 1;
		let i = openAt + 1;
		while (i < str.length && depth > 0) {
			if (str[i] === '(') { depth++; }
			else if (str[i] === ')') { depth--; }
			i++;
		}
		if (depth !== 0) { return null; }
		return [str.slice(openAt + 1, i - 1), i];
	}

	/**
	 * Find the matching closing directive for an opening one,
	 * accounting for nesting of the same directive type.
	 */
	private _findClosingDirective(html: string, startPos: number, openKw: string, closeKw: string): number {
		let depth = 1;
		const re = new RegExp(`@(${openKw}|${closeKw})\\b`, 'g');
		re.lastIndex = startPos;
		let m: RegExpExecArray | null;
		while ((m = re.exec(html)) !== null) {
			if (m[1] === openKw) { depth++; }
			else { depth--; if (depth === 0) { return m.index; } }
		}
		return -1;
	}

	private _escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}
