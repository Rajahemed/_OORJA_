const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// The corrupted SVGs look like this:
// <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' alt="Road Warrior EV Delivery Rider" loading="lazy">
// We need to remove the injected alt and loading from them so the double quotes don't break the src attribute.

html = html.replace(/<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' width='24' height='24' alt="Road Warrior EV Delivery Rider" loading="lazy">/g, "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>");

// Let's also check if there's any other corrupted SVG
html = html.replace(/<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' width='24' height='24' alt="[^"]+" loading="lazy">/g, "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>");

// Check if any other double quotes exist inside the data URI
html = html.replace(/src="data:image\/svg\+xml;utf8,([^"]+)"/g, (match, svgContent) => {
    // If the SVG content has double quotes, replace them with single quotes so they don't break the src attribute
    let fixedSvg = svgContent.replace(/"/g, "'");
    return `src="data:image/svg+xml;utf8,${fixedSvg}"`;
});

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fixed corrupted SVG data URIs.");
