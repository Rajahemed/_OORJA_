const fs = require('fs');

const htmlPath = 'd:/Road-Warrior/public/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Fix dummy QR alt
html = html.replace(
  '<img src="/img/dummy-qr.webp" style="width:100%; height:auto; opacity:0;" onerror="this.style.display=\'none\'" alt="Road Warrior Image">',
  '<img src="/img/dummy-qr.webp" style="width:100%; height:auto; opacity:0;" onerror="this.style.display=\'none\'" alt="Dummy QR Code for verification">'
);

// Fix platform pills alt
const platforms = ['Swiggy', 'Zomato', 'Blinkit', 'Porter', 'Dunzo', 'DHL', 'Amazon', 'Flipkart', 'Zepto'];

platforms.forEach(plat => {
  const regex = new RegExp(`(selectPlatformPill\\('${plat}', this\\)">[^>]+<img [^>]+)alt="Road Warrior Image"`, 'g');
  html = html.replace(regex, `$1alt="${plat} platform logo"`);
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html alt tags fixed');

const jsPath = 'd:/Road-Warrior/public/js/app.js';
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(
  '`<img src="${logoUrl}" onerror="this.style.display=\\\'none\\\'" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> ${value}`',
  '`<img src="${logoUrl}" alt="${value} logo" onerror="this.style.display=\\\'none\\\'" style="width:24px; height:24px; border-radius:4px; object-fit:contain; background:#fff; padding:2px;"> ${value}`'
);

fs.writeFileSync(jsPath, js, 'utf8');
console.log('app.js alt tags fixed');
