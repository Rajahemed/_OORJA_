const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const indexPath = 'd:/Road-Warrior/public/index.html';
const htmlContent = fs.readFileSync(indexPath, 'utf8');

const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// 1. Update the Navbar
const navbarNav = document.querySelector('.navbar-nav');
if (navbarNav) {
    // Add the new links at the beginning of the ul
    const newLinksHTML = `
        <li class="nav-item landing-only"><a href="#homeHeroSlider" class="nav-link" onclick="scrollToSection(event, 'homeHeroSlider')"><span data-i18n="nav_home">Home</span></a></li>
        <li class="nav-item landing-only"><a href="#about-oorja" class="nav-link" onclick="scrollToSection(event, 'about-oorja')"><span data-i18n="nav_about">About Oorja</span></a></li>
        <li class="nav-item landing-only"><a href="#products-services" class="nav-link" onclick="scrollToSection(event, 'products-services')"><span data-i18n="nav_products">Products & Services</span></a></li>
        <li class="nav-item landing-only"><a href="#ecosystem-watch" class="nav-link" onclick="scrollToSection(event, 'ecosystem-watch')"><span data-i18n="nav_ecosystem">Ecosystem Watch</span></a></li>
        <li class="nav-item landing-only"><a href="#authLayout" class="nav-link" onclick="scrollToSection(event, 'authLayout')"><span data-i18n="nav_login">Login</span></a></li>
    `;
    
    // We want to keep the existing auth links (Score, Dashboard, Profile).
    // Let's find the existing "About Us" link and remove it to avoid duplication.
    const existingLinks = Array.from(navbarNav.querySelectorAll('.nav-item'));
    existingLinks.forEach(li => {
        if (li.textContent.includes('About Us')) {
            li.remove();
        }
    });

    // Insert new links
    navbarNav.insertAdjacentHTML('afterbegin', newLinksHTML);
}

// 2. Fix the width of the sections. 
// They currently have style="max-width: 1000px; margin: 0 auto; padding: 4rem 1rem;"
// Let's update them to have a larger max-width, or just remove max-width so they fill the container
const narrowDivs = document.querySelectorAll('div[style*="max-width: 1000px"]');
narrowDivs.forEach(div => {
    let style = div.getAttribute('style');
    style = style.replace('max-width: 1000px', 'max-width: 1600px; width: 100%');
    div.setAttribute('style', style);
});

// Also make sure .container for home page expands
// Let's inject some CSS for this at the end of the head
const styleTag = document.createElement('style');
styleTag.textContent = `
    body.home-page-active .container {
        max-width: 100% !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }
    .landing-only {
        display: list-item;
    }
    body:not(.home-page-active) .landing-only {
        display: none !important;
    }
`;
document.head.appendChild(styleTag);

// 3. Inject scrollToSection function
const scriptTag = document.createElement('script');
scriptTag.textContent = `
    function scrollToSection(event, sectionId) {
        event.preventDefault();
        const section = document.getElementById(sectionId);
        if (section) {
            // Close mobile menu if open
            const nav = document.querySelector('.navbar-nav');
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
            
            // Scroll to the section
            const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - 80; // 80px offset for sticky header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }
`;
document.body.appendChild(scriptTag);

// Save the file
fs.writeFileSync(indexPath, dom.serialize(), 'utf8');
console.log("Updated index.html successfully with jsdom.");
