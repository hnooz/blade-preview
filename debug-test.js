// Debug test to find the exact issue
const fs = require('fs');

const bladeContent = fs.readFileSync('example-laravel-helpers.blade.php', 'utf8');

console.log('=== INPUT SAMPLE ===');
const linkLines = bladeContent.split('\n').filter(l => l.includes('<link') && l.includes('{{'));
linkLines.forEach((l, i) => console.log(`${i+1}: ${l.trim()}`));

console.log('\n=== TESTING REGEX PATTERNS ===');

// Test 1: Simple pattern
const test1 = '<link rel="stylesheet" href="{{ asset(\'css/app.css\') }}">';
const regex1 = /<link\s[^>]*href\s*=\s*["']\{\{[^}]+\}\}["'][^>]*>/gi;
console.log('\nTest 1 - Simple match:');
console.log('  Input:', test1);
console.log('  Regex:', regex1);
console.log('  Match:', test1.match(regex1));

// Test 2: Check if the issue is [^}]+ not matching inner content with spaces
const regex2 = /<link[^>]*\{\{[^}]+\}\}[^>]*>/gi;
console.log('\nTest 2 - Simpler pattern:');
console.log('  Match:', test1.match(regex2));

// Test 3: Even simpler
const regex3 = /<link[^>]*\{\{.*?\}\}[^>]*>/gi;
console.log('\nTest 3 - Non-greedy:');
console.log('  Match:', test1.match(regex3));

// Test 4: Check what the blade content actually contains
console.log('\n=== ACTUAL BLADE CONTENT LINK TAGS ===');
const allLinks = bladeContent.match(/<link[^>]*>/gi);
if (allLinks) {
    allLinks.forEach((l, i) => console.log(`${i+1}: ${l}`));
}

// Test 5: Apply the working regex to full content
console.log('\n=== APPLYING FIX ===');
let html = bladeContent;

// Use a simpler, more reliable pattern
html = html.replace(/<link[^>]*\{\{.*?\}\}[^>]*>/gi, '<!-- link removed -->');
html = html.replace(/<script[^>]*\{\{.*?\}\}[^>]*>(<\/script>)?/gi, '<!-- script removed -->');
html = html.replace(/@vite\s*\([^)]*\)/g, '<!-- vite removed -->');

// Check remaining helper patterns before {{ }} processing
const remainingHelpers = html.match(/\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}/g);
console.log('Remaining helpers after link/script removal:', remainingHelpers ? remainingHelpers.length : 0);
if (remainingHelpers) {
    remainingHelpers.forEach(h => console.log('  -', h));
    // Remove them
    html = html.replace(/\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}/g, '');
}

// Now apply {{ }} transformation
html = html.replace(/\{\{\s*(.+?)\s*\}\}/g, '<span class="blade-variable">[$1]</span>');

// Check for any [asset(, [url(, etc in final output
const badPatterns = html.match(/\[(asset|url|public_path|base_path|mix)\s*\(/gi);
if (badPatterns) {
    console.log('\n❌ STILL HAS ISSUES:', badPatterns);
} else {
    console.log('\n✅ NO HELPER FUNCTIONS VISIBLE IN OUTPUT');
}

// Write output
fs.writeFileSync('debug-output.html', html);
console.log('\nOutput written to debug-output.html');
