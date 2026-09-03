const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync('d:/Road-Warrior/public/index.html'));
const doc = dom.window.document;

// 1. Remove duplicate landing sections
const sections = doc.querySelectorAll('#oorja-landing-sections');
if (sections.length > 1) {
    for (let i = 1; i < sections.length; i++) {
        sections[i].remove();
    }
}

// 2. Update mobile drawer brand logo
const mobileBrand = doc.querySelector('.mobile-drawer-brand');
if (mobileBrand) {
    const img = doc.createElement('img');
    img.src = '/img/oorja-logo.png';
    img.alt = 'OORJA';
    img.className = 'mobile-drawer-brand';
    img.style.maxHeight = '30px';
    mobileBrand.replaceWith(img);
}

// 3. Add landing-only links to mobile drawer
const mobileDrawerNav = doc.querySelector('#mobileDrawerNav');
if (mobileDrawerNav) {
    // Remove existing landing links if any
    const existingLandingLinks = mobileDrawerNav.querySelectorAll('.landing-only');
    existingLandingLinks.forEach(el => el.remove());

    const linksHtml = `
        <li class="mobile-drawer-item landing-only"><a href="#homeHeroSlider" class="mobile-drawer-link" onclick="scrollToSection(event, 'homeHeroSlider'); closeMobileDrawer();">Home</a></li>
        <li class="mobile-drawer-item landing-only"><a href="#about-oorja" class="mobile-drawer-link" onclick="scrollToSection(event, 'about-oorja'); closeMobileDrawer();">About Oorja</a></li>
        <li class="mobile-drawer-item landing-only"><a href="#products-services" class="mobile-drawer-link" onclick="scrollToSection(event, 'products-services'); closeMobileDrawer();">Products &amp; Services</a></li>
        <li class="mobile-drawer-item landing-only"><a href="#ecosystem-watch" class="mobile-drawer-link" onclick="scrollToSection(event, 'ecosystem-watch'); closeMobileDrawer();">Ecosystem Watch</a></li>
        <li class="mobile-drawer-item landing-only"><a href="#authLayout" class="mobile-drawer-link" onclick="scrollToSection(event, 'authLayout'); closeMobileDrawer();">Login</a></li>
    `;
    
    // Insert after the close button or at the beginning of the nav
    const mobileNavHomeItem = doc.querySelector('#mobileNavHomeItem');
    if (mobileNavHomeItem) {
        mobileNavHomeItem.insertAdjacentHTML('beforebegin', linksHtml);
    } else {
        mobileDrawerNav.insertAdjacentHTML('afterbegin', linksHtml);
    }
}

fs.writeFileSync('d:/Road-Warrior/public/index.html', dom.serialize(), 'utf8');
console.log('Fixed duplicates and mobile drawer');
