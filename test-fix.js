const fs = require('fs');

const html = fs.readFileSync('example-laravel-helpers.blade.php', 'utf8');

let result = html;

// Test the regex
const linkRegex = /<link[^>]*\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}[^>]*>/gi;
const matches = html.match(linkRegex);
console.log('Matches found:', matches ? matches.length : 0);
if (matches) matches.forEach((m, i) => console.log(`  ${i+1}:`, m.substring(0, 80)));

result = result.replace(linkRegex, '');

// Check @vite
result = result.replace(/@vite\s*\(\s*\[[^\]]*\]\s*\)/g, '');

// Check remaining {{ }} with helpers
const remaining = result.match(/\{\{\s*(asset|url|public_path|base_path|resource_path|mix)\s*\([^)]*\)\s*\}\}/g);
console.log('\nRemaining helpers after cleanup:', remaining ? remaining.length : 0);
if (remaining) remaining.forEach((m, i) => console.log(`  ${i+1}:`, m));

console.log('\n--- Sample output (first 500 chars of head) ---');
const headMatch = result.match(/<head>[\s\S]*?<\/head>/);
if (headMatch) console.log(headMatch[0].substring(0, 500));
