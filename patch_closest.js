const fs = require('fs');
let appJs = fs.readFileSync('public/js/app.js', 'utf8');

// Fix 1: line 1170
appJs = appJs.replace(
    "sec.querySelector('input[name=\"vehicleType\"]').closest('.radio-group')",
    "sec.querySelector('input[name=\"vehicleType\"]')?.closest('.radio-group')"
);

// Fix 2: line 1193
appJs = appJs.replace(
    "sec.querySelector('input[name=\"fuelMethod\"]').closest('.radio-group')",
    "sec.querySelector('input[name=\"fuelMethod\"]')?.closest('.radio-group')"
);

// Fix 3: line 1245, 1264, 1319 (radios[0] is already guarded by length > 0, but we can add ?. just in case)
appJs = appJs.replace(
    /radios\[0\]\.closest/g,
    "radios[0]?.closest"
);

// Fix 4: line 1280
appJs = appJs.replace(
    "firstTrigger.closest('.checkbox-group')",
    "firstTrigger?.closest('.checkbox-group')"
);

// Fix 5: line 1297
appJs = appJs.replace(
    "firstInterest.closest('.radio-group')",
    "firstInterest?.closest('.radio-group')"
);

// Fix 6: other closest calls just in case
appJs = appJs.replace(
    "event.target.closest('button')",
    "event.target?.closest?.('button')"
);
appJs = appJs.replace(
    "input.closest('.hidden-section')",
    "input?.closest?.('.hidden-section')"
);
appJs = appJs.replace(
    "input.closest('.radio-group') || input.closest('.form-group')",
    "input?.closest?.('.radio-group') || input?.closest?.('.form-group')"
);
appJs = appJs.replace(
    "input.closest('.checkbox-group') || input.closest('.form-group')",
    "input?.closest?.('.checkbox-group') || input?.closest?.('.form-group')"
);

fs.writeFileSync('public/js/app.js', appJs, 'utf8');
console.log('Patched all unsafe .closest() calls in app.js');
