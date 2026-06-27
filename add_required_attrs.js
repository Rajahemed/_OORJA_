const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const radioNames = [
    'vehicleType',
    'fuelMethod',
    'workType',
    'workSchedule',
    'primaryTime',
    'hasHealth',
    'openEV',
    'referredBy'
];

radioNames.forEach(name => {
    // Add required to all radio buttons of this name
    const regex = new RegExp(`(<input type="radio" name="${name}")(?![^>]*required)`, 'g');
    html = html.replace(regex, `$1 required`);
});

fs.writeFileSync('public/index.html', html);
console.log('Added required attributes to radio buttons');
