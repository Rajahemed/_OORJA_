$lines = Get-Content -Path "diff.txt"

$inBlock = $false
$translations = @()

foreach ($line in $lines) {
    if ($line -match "^-\s*const TRANSLATIONS = {") {
        $inBlock = $true
    }
    
    if ($inBlock) {
        # Strip the minus sign and any trailing whitespace at the beginning
        $cleanLine = $line -replace "^-\s?", ""
        $translations += $cleanLine
        
        if ($line -match "^-\s*};") {
            $inBlock = $false
            break
        }
    }
}

$finalContent = $translations -join "`n"

$footer = @"

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
"@

$finalContent += "`n" + $footer

# Save as UTF-8 encoding
Set-Content -Path "public/js/i18n.js" -Value $finalContent -Encoding UTF8

Write-Host "Translations extracted and saved in UTF-8!"
