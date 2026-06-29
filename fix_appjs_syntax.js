const fs = require('fs');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Find the incorrectly patched lines and fix them
// Currently they look like: showToast(window.t ? window.t('msg_xyz') : 'Original Text'
// Missing a closing parenthesis. But wait! showToast has two arguments sometimes!
// showToast('Copied!', 'success')
// If I replaced `showToast('Copied!'` with `showToast(window.t ? window.t('msg_xyz') : 'Copied!'`, then it becomes:
// showToast(window.t ? window.t('msg_xyz') : 'Copied!', 'success')
// Oh! I didn't replace the closing parenthesis of showToast! I only matched `showToast('Copied!'`.
// Let's check my regex: /(showToast|alert)\s*\(\s*(['"`])(.*?)\2/g
// It matched `showToast('Copied'` + closing quote.
// Replacement: `$1(window.t ? window.t('${key}') : '$2${text}$2'`
// Wait, the original was `showToast('Copied'`
// The replacement is `showToast(window.t ? window.t('msg') : 'Copied'`
// But what about the closing parenthesis of the ternary operator?
// `(window.t ? window.t('msg') : 'Copied')`
// Let's see: `showToast((window.t ? window.t('msg') : 'Copied')`
// Yes! I need an extra parenthesis around the ternary!

appJs = appJs.replace(/(showToast|alert)\(window\.t \? window\.t\('([^']+)'\) : (['"`])(.*?)\3/g, '$1((window.t ? window.t(\'$2\') : $3$4$3))');

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('Fixed syntax error in app.js');
