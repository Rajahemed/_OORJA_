const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const refPath = 'C:/Users/Latitude/.gemini/antigravity-ide/brain/aacb2b6a-2e53-413f-84ab-cdfb417db6bc/scratch/reference.html';
const refHtml = fs.readFileSync(refPath, 'utf8');

const dom = new JSDOM(refHtml);
const styles = Array.from(dom.window.document.querySelectorAll('style')).map(s => s.textContent).join('\n');

// We need to scope the styles to body.home-page-active
// However, there are media queries. 
// A simple regex approach to scope CSS rules:
let scopedCss = styles.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector, rest) => {
    selector = selector.trim();
    if (selector.startsWith('@') || selector === ':root' || selector === '100%') return match;
    if (selector.includes('body.home-page-active')) return match;
    
    // Split by comma for multiple selectors
    const selectors = selector.split(',').map(s => s.trim());
    const scopedSelectors = selectors.map(s => {
        if (s.startsWith('@') || s === ':root') return s;
        if (s === 'body' || s === 'html') return `body.home-page-active`;
        return `body.home-page-active ${s}`;
    });
    
    return scopedSelectors.join(', ') + rest;
});

// Since the regex might mess up some things, let's use a more robust CSS parser if we had one, but we don't.
// Alternatively, I can just write a simpler parser.
// Actually, it's safer to just prepend `.oorja-landing ` and wrap the landing page content in `<div class="oorja-landing">`
// This avoids messing with the body tag.
// Let's modify the reference HTML directly to wrap everything in `.oorja-landing` and then we can scope the CSS to `.oorja-landing`.

const cssOutPath = 'd:/Road-Warrior/public/css/landing.css';

// I will write a simpler scoping function
function scopeCss(css, scope) {
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    let result = '';
    let inMediaQuery = false;
    let braceLevel = 0;
    
    // We can use a simpler approach: just wrap everything in a selector if we use a preprocessor, 
    // but here we just prepend the scope to every selector.
    // Since writing a CSS parser is hard, let's just use the regex approach but be very careful.
    
    const rules = css.split('}');
    for (let rule of rules) {
        if (!rule.trim()) continue;
        
        let [selectorsStr, body] = rule.split('{');
        if (!body) {
             result += rule + '}';
             continue;
        }
        
        selectorsStr = selectorsStr.trim();
        
        if (selectorsStr.startsWith('@media')) {
            result += selectorsStr + ' {\n';
            // the body contains the nested rules
            // wait, split('}') breaks nested media queries.
            // Let's use a different approach.
        }
    }
}

// Instead of complex parsing, I will just output the CSS as is, BUT I will manually replace the dangerous global tags.
// The global tags in the reference are: html, body, h1, h2, h3, h4, p, a, img, .wrap, section, .btn
let safeCss = styles
    .replace(/body\s*\{/g, '.oorja-landing {')
    .replace(/html\s*\{/g, '.oorja-landing-wrapper {')
    .replace(/h1,\s*h2,\s*h3,\s*h4\s*\{/g, '.oorja-landing h1, .oorja-landing h2, .oorja-landing h3, .oorja-landing h4 {')
    .replace(/p\s*\{/g, '.oorja-landing p {')
    .replace(/a\s*\{/g, '.oorja-landing a {')
    .replace(/img\s*\{/g, '.oorja-landing img {')
    .replace(/\.wrap\s*\{/g, '.oorja-landing .wrap {')
    .replace(/section\s*\{/g, '.oorja-landing section {')
    .replace(/\.btn\s*\{/g, '.oorja-landing .btn {')
    .replace(/\.btn:hover/g, '.oorja-landing .btn:hover')
    .replace(/\.btn-primary/g, '.oorja-landing .btn-primary')
    .replace(/\.btn-ghost/g, '.oorja-landing .btn-ghost')
    .replace(/\.btn-light/g, '.oorja-landing .btn-light')
    .replace(/header\.site/g, '.oorja-landing header.site')
    .replace(/\.nav/g, '.oorja-landing .nav')
    .replace(/\.hero/g, '.oorja-landing .hero')
    .replace(/\.about/g, '.oorja-landing .about')
    .replace(/\.services/g, '.oorja-landing .services')
    .replace(/\.journey/g, '.oorja-landing .journey')
    .replace(/\.stop/g, '.oorja-landing .stop')
    .replace(/\.edge/g, '.oorja-landing .edge')
    .replace(/\.products/g, '.oorja-landing .products')
    .replace(/\.membership/g, '.oorja-landing .membership')
    .replace(/\.news/g, '.oorja-landing .news')
    .replace(/\.campaign/g, '.oorja-landing .campaign')
    .replace(/footer/g, '.oorja-landing footer');

fs.writeFileSync(cssOutPath, safeCss, 'utf8');
console.log("Extracted and safely scoped CSS to " + cssOutPath);

// Now let's process index.html to add the link
const indexPath = 'd:/Road-Warrior/public/index.html';
let indexHtml = fs.readFileSync(indexPath, 'utf8');

if (!indexHtml.includes('landing.css')) {
    indexHtml = indexHtml.replace('</head>', '    <link rel="stylesheet" href="/css/landing.css">\n</head>');
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log("Added landing.css link to index.html");
}
