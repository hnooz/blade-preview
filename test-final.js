const fs = require('fs');

// Read the example file
const bladeContent = fs.readFileSync('example-laravel-helpers.blade.php', 'utf8');

function renderBladeTemplate(bladeContent) {
    let html = bladeContent;

    // ============================================================
    // STEP 1: Remove all Laravel asset helper tags BEFORE {{ }} processing
    // ============================================================
    
    // Remove entire lines containing <link> with Laravel helpers
    html = html.split('\n').filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<link') && /\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\(/.test(trimmed)) {
            return false;
        }
        return true;
    }).join('\n');
    
    // Remove entire lines containing <script> with Laravel helpers
    html = html.split('\n').filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<script') && /\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\(/.test(trimmed)) {
            return false;
        }
        return true;
    }).join('\n');
    
    // Remove @vite directives (entire line)
    html = html.split('\n').filter(line => {
        return !line.trim().startsWith('@vite');
    }).join('\n');
    
    // ============================================================
    // STEP 2: Handle remaining Laravel helpers in attributes
    // ============================================================
    
    // Replace action="{{ url() }}" with action="#"
    html = html.replace(/action\s*=\s*["']\{\{[^}]+\}\}["']/gi, 'action="#"');
    
    // Replace value="{{ old() }}" with value=""
    html = html.replace(/value\s*=\s*["']\{\{\s*old\s*\([^)]*\)\s*\}\}["']/gi, 'value=""');
    
    // Replace any remaining {{ helper() }} for asset-type functions
    html = html.replace(/\{\{\s*(asset|url|public_path|base_path|resource_path|mix|old|config|env|route|action)\s*\([^)]*\)\s*\}\}/gi, '');
    html = html.replace(/\{!!\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*!!\}/gi, '');

    // Handle @extends
    html = html.replace(/@extends\(['"](.+?)['"]\)/g, '<!-- extends: $1 -->');

    // Handle @section and @endsection
    html = html.replace(/@section\(['"](.+?)['"]\)/g, '<!-- section: $1 -->');
    html = html.replace(/@endsection/g, '<!-- end section -->');

    // Handle @yield
    html = html.replace(/@yield\(['"](.+?)['"](?:,\s*['"](.+?)['"]\))?\)/g, (match, name, defaultContent) => {
        return defaultContent ? `<div data-section="${name}">${defaultContent}</div>` : `<div data-section="${name}"><!-- yield: ${name} --></div>`;
    });

    // Handle @if, @elseif, @else, @endif
    html = html.replace(/@if\s*\((.+?)\)/g, '<!-- if: $1 -->');
    html = html.replace(/@elseif\s*\((.+?)\)/g, '<!-- elseif: $1 -->');
    html = html.replace(/@else/g, '<!-- else -->');
    html = html.replace(/@endif/g, '<!-- endif -->');

    // Handle @foreach, @endforeach
    html = html.replace(/@foreach\s*\((.+?)\)/g, '<!-- foreach: $1 -->');
    html = html.replace(/@endforeach/g, '<!-- endforeach -->');

    // Handle @csrf and @method
    html = html.replace(/@csrf/g, '<input type="hidden" name="_token" value="PREVIEW_TOKEN">');
    html = html.replace(/@method\(['"](.+?)['"]\)/g, '<input type="hidden" name="_method" value="$1">');

    // Handle Blade comments
    html = html.replace(/\{\{--.*?--\}\}/gs, '');

    // Handle {{ }} - escaped output (show as text with styling)
    html = html.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, content) => {
        return `<span class="blade-variable">[${content.trim()}]</span>`;
    });

    // Handle {!! !!} - unescaped output
    html = html.replace(/\{!!\s*(.+?)\s*!!\}/g, (match, content) => {
        return `<span class="blade-raw">[RAW: ${content.trim()}]</span>`;
    });

    return html;
}

const result = renderBladeTemplate(bladeContent);

// Check for problems
console.log('=== TESTING BLADE PREVIEW ===\n');

// Check if any Laravel helpers are still visible (not in HTML comments)
const helperPatterns = [
    { pattern: /\[asset\(/gi, name: 'asset()' },
    { pattern: /\[url\(/gi, name: 'url()' },
    { pattern: /\[public_path\(/gi, name: 'public_path()' },
    { pattern: /\[base_path\(/gi, name: 'base_path()' },
    { pattern: /\[mix\(/gi, name: 'mix()' },
    { pattern: /@vite\s*\(/gi, name: '@vite()' }, // Only match @vite with parenthesis (actual directive)
];

let hasIssues = false;
helperPatterns.forEach(({pattern, name}) => {
    const matches = result.match(pattern);
    if (matches) {
        console.log('❌ ISSUE: Found', name, ':', matches.length, 'occurrences');
        hasIssues = true;
    }
});

// Check for <link> or <script> tags with {{ }}
const linkWithHelper = result.match(/<link[^>]*\{\{[^}]+\}\}[^>]*>/gi);
const scriptWithHelper = result.match(/<script[^>]*\{\{[^}]+\}\}[^>]*>/gi);

if (linkWithHelper) {
    console.log('❌ ISSUE: Found <link> tags with {{ }}:', linkWithHelper.length);
    hasIssues = true;
}
if (scriptWithHelper) {
    console.log('❌ ISSUE: Found <script> tags with {{ }}:', scriptWithHelper.length);
    hasIssues = true;
}

if (!hasIssues) {
    console.log('✅ No Laravel helper functions visible in output');
}

// Check the <head> section
const headMatch = result.match(/<head>([\s\S]*?)<\/head>/);
if (headMatch) {
    console.log('\n=== HEAD SECTION ===');
    console.log(headMatch[1].trim());
}

// Write result to file for inspection
fs.writeFileSync('test-output.html', result);
console.log('\n✅ Full output written to test-output.html');
