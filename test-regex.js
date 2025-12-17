const fs = require('fs');

// Read the blade file
const bladeContent = fs.readFileSync('./example-laravel-helpers.blade.php', 'utf8');

let html = bladeContent;

console.log('=== BEFORE ===');
console.log('Contains asset():', html.includes("{{ asset("));
console.log('Contains url():', html.includes("{{ url("));
console.log('Contains @vite:', html.includes("@vite"));

// Remove entire <link> tags with Laravel helpers
html = html.replace(/<link[^>]*\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}[^>]*>/gi, '<!-- REMOVED LINK -->');

// Remove entire <script> tags with Laravel helpers
html = html.replace(/<script[^>]*\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}[^>]*>[\s\S]*?<\/script>/gi, '<!-- REMOVED SCRIPT -->');
html = html.replace(/<script[^>]*\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}[^>]*>/gi, '<!-- REMOVED SCRIPT -->');

// Remove @vite directives
html = html.replace(/@vite\s*\(\s*\[[^\]]*\]\s*\)/g, '<!-- REMOVED VITE -->');
html = html.replace(/@vite\s*\([^)]*\)/g, '<!-- REMOVED VITE -->');

// Remove standalone Laravel helper {{ }} blocks
html = html.replace(/\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}/g, '');

// Handle form actions with Laravel helpers
html = html.replace(/action=["']\{\{\s*(asset|url|route|action)\s*\([^)]*\)\s*\}\}["']/gi, 'action="#"');

// Handle href with Laravel helpers (non-CSS)
html = html.replace(/href=["']\{\{\s*(url|route|action)\s*\([^)]*\)\s*\}\}["']/gi, 'href="#"');

// Handle {{ }} - escaped output
html = html.replace(/\{\{\s*(.+?)\s*\}\}/g, (match, content) => {
    return `<span class="blade-variable">[${content.trim()}]</span>`;
});

console.log('\n=== AFTER ===');
console.log('Contains asset():', html.includes("asset("));
console.log('Contains url():', html.includes("url("));
console.log('Contains @vite:', html.includes("@vite"));
console.log('Contains [asset:', html.includes("[asset"));
console.log('Contains [url:', html.includes("[url("));

console.log('\n=== HEAD SECTION ===');
const headMatch = html.match(/<head>[\s\S]*?<\/head>/);
if (headMatch) {
    console.log(headMatch[0]);
}

console.log('\n=== FORM SECTION ===');
const formMatch = html.match(/<form[\s\S]*?<\/form>/);
if (formMatch) {
    console.log(formMatch[0]);
}
