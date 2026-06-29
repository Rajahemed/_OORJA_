const fs = require('fs');
const path = require('path');

// Simple analysis of index.html and app.js to generate the required inventory
function analyze() {
    let inventory = `# Translation Inventory & Codebase Analysis\n\n`;
    
    // 1. Pages
    inventory += `## 1. Pages\n`;
    inventory += `- index.html (Main SPA)\n`;
    inventory += `- admin.html (Admin Dashboard)\n`;
    inventory += `- community.html (Community Page)\n`;
    inventory += `- privacy.html (Privacy Policy)\n`;
    
    // 2. Main Sections / Components in index.html
    const html = fs.readFileSync('public/index.html', 'utf8');
    inventory += `\n## 2. Components & Sections (index.html)\n`;
    const sectionRegex = /<div class="[^"]*section[^"]*"|id="([^"]+)"/g;
    let match;
    let sections = new Set();
    while ((match = sectionRegex.exec(html)) !== null) {
        if (match[1] && (match[1].toLowerCase().includes('section') || match[1].toLowerCase().includes('page'))) {
            sections.add(match[1]);
        }
    }
    // Add known static ones
    ['Hero Section', 'Navbar', 'Footer', 'Sidebar', 'Leaderboard', 'Referral Page', 'Profile', 'Dashboard'].forEach(s => sections.add(s));
    sections.forEach(s => inventory += `- ${s}\n`);

    // 3. Modals / Popups
    inventory += `\n## 3. Modals & Dialogs\n`;
    const modalRegex = /id="([^"]+Modal[^"]*)"/gi;
    let modals = new Set();
    while ((match = modalRegex.exec(html)) !== null) {
        modals.add(match[1]);
    }
    ['Toast Notifications', 'Alert Dialogs', 'OTP Verification Modal'].forEach(s => modals.add(s));
    modals.forEach(m => inventory += `- ${m}\n`);

    // 4. Forms
    inventory += `\n## 4. Forms\n`;
    const formRegex = /<form[^>]*id="([^"]+)"/gi;
    let forms = new Set();
    while ((match = formRegex.exec(html)) !== null) {
        forms.add(match[1]);
    }
    forms.forEach(f => inventory += `- ${f}\n`);
    
    // 5. Hardcoded English Text Examples (Sample Extraction)
    inventory += `\n## 5. Sample Hardcoded Strings to Translate\n`;
    inventory += `\n### Navigation & UI\n- "Welcome"\n- "Dashboard"\n- "Profile"\n- "Leaderboard"\n- "Logout"\n- "Free Consultation"`;
    inventory += `\n\n### Forms & Labels\n- "Phone Number"\n- "Enter OTP"\n- "First Name"\n- "Submit"\n- "Cancel"`;
    inventory += `\n\n### Validation Messages (app.js)\n- "Invalid phone number"\n- "Please enter valid OTP"\n- "Network error. Please try again."\n- "Registration successful!"`;
    inventory += `\n\n### Admin Dashboard\n- "Total Riders"\n- "Active EVs"\n- "Download CSV"\n- "Approve"\n- "Reject"`;
    
    // 6. Current Implementation
    inventory += `\n\n## 6. Current i18n State\n`;
    inventory += `The current implementation uses a custom inline JS object (\`window.TRANSLATIONS\`) and a data attribute (\`data-i18n\`). It is highly coupled, causing encoding bugs, and lacks dynamic fallback or async loading.`;
    
    fs.writeFileSync('C:/Users/Latitude/.gemini/antigravity-ide/brain/28648719-78fb-4562-bc9a-76584a9171da/translation_inventory.md', inventory);
    console.log("Inventory generated.");
}

analyze();
