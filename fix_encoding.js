const fs = require('fs');

try {
    // Try reading as utf8 first, if it fails to find the block, try utf16le
    let diffText = fs.readFileSync('diff.txt', 'utf8');
    
    if (!diffText.includes('const TRANSLATIONS = {')) {
        console.log('utf8 failed, trying utf16le...');
        diffText = fs.readFileSync('diff.txt', 'utf16le');
    }
    
    const startIndex = diffText.indexOf('const TRANSLATIONS = {');
    const endIndex = diffText.indexOf('window.t = function', startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        // We found it! Let's get the block.
        // But wait, the diff has minus signs. Let's trace back to the start of the line.
        let actualStartIndex = diffText.lastIndexOf('\n', startIndex) + 1;
        let block = diffText.substring(actualStartIndex, endIndex);
        
        // Split and clean the minus signs
        let cleanedLines = block.split('\n').map(line => {
            let clean = line.replace(/^-?\s*/, '');
            // We want to keep indentation for JS, so let's just replace the leading minus and space.
            if (line.startsWith('-    ')) return line.substring(5);
            if (line.startsWith('-   ')) return line.substring(4);
            if (line.startsWith('-  ')) return line.substring(3);
            if (line.startsWith('- ')) return line.substring(2);
            if (line.startsWith('-')) return line.substring(1);
            return line;
        });
        
        let newTranslations = cleanedLines.join('\n').trim();
        
        // Remove trailing "};" if we accidentally caught something weird, wait, the block ends before window.t = function.
        // It should naturally end with "};"
        
        const finalI18n = `
${newTranslations}

window.TRANSLATIONS = TRANSLATIONS;

window.t = function(key) {
    const lang = localStorage.getItem('selectedLang') || 'en';
    if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
        return window.TRANSLATIONS[lang][key];
    }
    return key;
};

window.applyTranslations = function() {
    const lang = localStorage.getItem('selectedLang') || 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'submit') {
                el.value = window.TRANSLATIONS[lang][key];
            } else {
                el.innerText = window.TRANSLATIONS[lang][key];
            }
        }
    });
};
`;

        fs.writeFileSync('public/js/i18n.js', finalI18n, 'utf8');
        console.log('Successfully written clean UTF-8 i18n.js!');
    } else {
        console.error('Could not find translation block!');
    }
} catch (e) {
    console.error('Error:', e);
}
