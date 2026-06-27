const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\Latitude\\.gemini\\antigravity-ide\\brain\\9e18bc47-6f76-4355-a586-d7df1b8b0c08\\.system_generated\\logs\\transcript_full.jsonl', 'utf8').split('\n');
const match = lines.find(l => l.includes('multi_replace') && l.includes('Language Switcher'));
if (match) {
    fs.writeFileSync('d:\\Road-Warrior\\match.json', match, 'utf8');
    console.log('Saved to match.json');
} else {
    console.log('Not found');
}
