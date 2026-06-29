const fs = require('fs');

// Read the corrupted JS file which contains the TRANSLATIONS object
const i18nContent = fs.readFileSync('public/js/i18n.js', 'utf8');

// We need to extract the TRANSLATIONS object. 
// Since it's a JS object, we can evaluate it in a sandbox or just use a regex if it's simple enough.
// Actually, it's safer to use eval or Function constructor since we control the file.
let match = i18nContent.match(/const TRANSLATIONS = (\{[\s\S]*?\});/);

if (!match) {
    console.error("Could not find TRANSLATIONS object in i18n.js");
    process.exit(1);
}

const translationsStr = match[1];

// Evaluate the object
let TRANSLATIONS;
try {
    TRANSLATIONS = new Function('return ' + translationsStr)();
} catch (e) {
    console.error("Failed to parse TRANSLATIONS object", e);
    process.exit(1);
}

// Ensure locales directory exists
if (!fs.existsSync('public/locales')) {
    fs.mkdirSync('public/locales');
}

let report = "## Encoding Repair Report\n\n";

for (const lang of Object.keys(TRANSLATIONS)) {
    const langDir = `public/locales/${lang}`;
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir);
    }
    
    let originalObj = TRANSLATIONS[lang];
    let cleanObj = {};
    
    for (const key of Object.keys(originalObj)) {
        let val = originalObj[key];
        
        // REPAIR THE DOUBLE-ENCODED MOJIBAKE
        // Check if it's double-encoded (e.g. contains Latin-1 high characters like à, ¤, etc.)
        // We can just try to convert Buffer.from(val, 'latin1').toString('utf8')
        // But if it's plain English, converting to latin1 and back to utf8 doesn't hurt IF it's 100% ASCII.
        // Wait, if it has real UTF-8 (not mojibake), Buffer.from(val, 'latin1') will TRUNCATE the high bytes (e.g. \u0905 -> 0x05)!
        // So we should ONLY do this if the string contains suspicious latin1 characters (like \u00E0).
        let isMojibake = val.split('').some(c => c.charCodeAt(0) > 127 && c.charCodeAt(0) <= 255);
        let hasTrueUnicode = val.split('').some(c => c.charCodeAt(0) > 255);
        
        if (isMojibake && !hasTrueUnicode) {
            try {
                // The magic recovery!
                let recovered = Buffer.from(val, 'latin1').toString('utf8');
                // If it recovered to replacement characters  (0xFFFD), then it wasn't pure UTF-8 double-encoded
                if (!recovered.includes('\uFFFD')) {
                    val = recovered;
                }
            } catch (e) {
                // Ignore
            }
        }
        
        cleanObj[key] = val;
    }
    
    // Save to proper JSON file without BOM
    fs.writeFileSync(`${langDir}/common.json`, JSON.stringify(cleanObj, null, 2), 'utf8');
    report += `- Generated clean UTF-8 for language: ${lang}\n`;
}

fs.writeFileSync('repair_report.md', report, 'utf8');
console.log("Successfully extracted and repaired all translations to JSON!");
