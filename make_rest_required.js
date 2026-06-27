const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');
const formSections = html.match(/<div class="form-section" id="regSection[2-6]"[\s\S]*?<!-- End of regSection\d -->/g);

if (formSections) {
    formSections.forEach(section => {
        let newSection = section;
        
        // Find inputs or selects that are not hidden and not required, and add required to them
        // For type=radio and type=checkbox, we already did it, but let's just make sure
        const matches = section.match(/<input[^>]*>|<select[^>]*>/g);
        
        if (matches) {
            matches.forEach(m => {
                // If it is an "Other" conditional input, we skip it
                if (m.includes('display:none')) return;
                
                // If it's the referral code which is hidden inside a hidden block, skip
                if (m.includes('regReferralCode')) return;

                // If it already has required, skip
                if (m.includes('required')) return;

                // If it's a checkbox, skip (we handled them before, wait, did we? Yes, make_all_required.js added them. But I'll make sure!)
                // Actually, let's just replace everything that isn't required and isn't hidden with required
                // Except regVehicleModel which is optional, but user wants ALL fields mandatory, so let's make it required too!
                // We'll also remove the "(optional)" text in the HTML.
                
                let newTag = m.replace(/<input /g, '<input required ');
                newTag = newTag.replace(/<select /g, '<select required ');
                
                newSection = newSection.replace(m, newTag);
            });
        }
        
        // Remove the "(optional)" text for vehicle model to match user's request
        newSection = newSection.replace('<span style="color:var(--text-secondary); font-size:0.8rem;">(optional)</span>', '');

        html = html.replace(section, newSection);
    });
}

fs.writeFileSync('public/index.html', html);
console.log('Added required to all remaining fields');
