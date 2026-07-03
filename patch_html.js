const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');
const replacements = [
    // Swiggy to Other (div pills)
    [` margin-right: 6px;">Swiggy</div>`, ` margin-right: 6px;"><span data-i18n="plat_swiggy">Swiggy</span></div>`],
    [` margin-right: 6px;">Zomato</div>`, ` margin-right: 6px;"><span data-i18n="plat_zomato">Zomato</span></div>`],
    [` margin-right: 6px;">Blinkit</div>`, ` margin-right: 6px;"><span data-i18n="plat_blinkit">Blinkit</span></div>`],
    [` margin-right: 6px;">Porter</div>`, ` margin-right: 6px;"><span data-i18n="plat_porter">Porter</span></div>`],
    [` margin-right: 6px;">Dunzo</div>`, ` margin-right: 6px;"><span data-i18n="plat_dunzo">Dunzo</span></div>`],
    [` margin-right: 6px;">DHL</div>`, ` margin-right: 6px;"><span data-i18n="plat_dhl">DHL</span></div>`],
    [` margin-right: 6px;">Amazon</div>`, ` margin-right: 6px;"><span data-i18n="plat_amazon">Amazon</span></div>`],
    [` margin-right: 6px;">Flipkart</div>`, ` margin-right: 6px;"><span data-i18n="plat_flipkart">Flipkart</span></div>`],
    [` margin-right: 6px;">Zepto</div>`, ` margin-right: 6px;"><span data-i18n="plat_zepto">Zepto</span></div>`],
    [`<i class="fas fa-ellipsis-h" style="font-size:10px; color:var(--text-secondary);"></i></div>Other</div>`, `<i class="fas fa-ellipsis-h" style="font-size:10px; color:var(--text-secondary);"></i></div><span data-i18n="plat_other">Other</span></div>`],
    
    // Select dropdowns
    [`<option value="Swiggy">Swiggy</option>`, `<option value="Swiggy" data-i18n="plat_swiggy">Swiggy</option>`],
    [`<option value="Zomato">Zomato</option>`, `<option value="Zomato" data-i18n="plat_zomato">Zomato</option>`],
    [`<option value="Blinkit">Blinkit</option>`, `<option value="Blinkit" data-i18n="plat_blinkit">Blinkit</option>`],
    [`<option value="Porter">Porter</option>`, `<option value="Porter" data-i18n="plat_porter">Porter</option>`],
    [`<option value="Dunzo">Dunzo</option>`, `<option value="Dunzo" data-i18n="plat_dunzo">Dunzo</option>`],
    [`<option value="DHL">DHL</option>`, `<option value="DHL" data-i18n="plat_dhl">DHL</option>`],
    [`<option value="Amazon">Amazon</option>`, `<option value="Amazon" data-i18n="plat_amazon">Amazon</option>`],
    [`<option value="Flipkart">Flipkart</option>`, `<option value="Flipkart" data-i18n="plat_flipkart">Flipkart</option>`],
    [`<option value="Zepto">Zepto</option>`, `<option value="Zepto" data-i18n="plat_zepto">Zepto</option>`],
    [`<option value="Other">Other</option>`, `<option value="Other" data-i18n="plat_other">Other</option>`],

    // Exp pills
    [`>0-6 months</div>`, `><span data-i18n="exp_0_6">0-6 months</span></div>`],
    [`>1-2 Years</div>`, `><span data-i18n="exp_1_2">1-2 Years</span></div>`],
    [`>2-3 Years</div>`, `><span data-i18n="exp_2_3">2-3 Years</span></div>`],
    [`>3-4 Years</div>`, `><span data-i18n="exp_3_4">3-4 Years</span></div>`],
    [`>4-5 Years</div>`, `><span data-i18n="exp_4_5">4-5 Years</span></div>`],
    [`>5-6 Years</div>`, `><span data-i18n="exp_5_6">5-6 Years</span></div>`],
    [`>6+ Years</div>`, `><span data-i18n="exp_6_plus">6+ Years</span></div>`],
    
    // Exp dropdown
    [`<option value="0-6 months">0-6 months</option>`, `<option value="0-6 months" data-i18n="exp_0_6">0-6 months</option>`],
    [`<option value="1-2">1-2 Years</option>`, `<option value="1-2" data-i18n="exp_1_2">1-2 Years</option>`],
    [`<option value="2-3">2-3 Years</option>`, `<option value="2-3" data-i18n="exp_2_3">2-3 Years</option>`],
    [`<option value="3-4">3-4 Years</option>`, `<option value="3-4" data-i18n="exp_3_4">3-4 Years</option>`],
    [`<option value="4-5">4-5 Years</option>`, `<option value="4-5" data-i18n="exp_4_5">4-5 Years</option>`],
    [`<option value="5-6">5-6 Years</option>`, `<option value="5-6" data-i18n="exp_5_6">5-6 Years</option>`],
    [`<option value="6+">6+ Years</option>`, `<option value="6+" data-i18n="exp_6_plus">6+ Years</option>`],

    // Section B
    [`<label>Vehicle Ownership</label>`, `<label data-i18n="lbl_ownership">Vehicle Ownership</label>`],
    [`🏍️ Own</label>`, `🏍️ <span data-i18n="own_own">Own</span></label>`],
    [`🤝 Rented</label>`, `🤝 <span data-i18n="own_rented">Rented</span></label>`],
    [`<label>Weekly Rent (₹)</label>`, `<label data-i18n="lbl_weekly_rent">Weekly Rent (₹)</label>`],
    [`<label>Monthly Rent (₹)</label>`, `<label data-i18n="lbl_monthly_rent">Monthly Rent (₹)</label>`],
    [`<label>How many hours do you work daily?</label>`, `<label data-i18n="lbl_hours">How many hours do you work daily?</label>`],
    [`<option value="">Select Working Hours</option>`, `<option value="" data-i18n="lbl_select_hours">Select Working Hours</option>`],
    [`<option value="Less than 4 hours">Less than 4 hours</option>`, `<option value="Less than 4 hours" data-i18n="hours_lt_4">Less than 4 hours</option>`],
    [`<option value="4-8 hours">4-8 hours</option>`, `<option value="4-8 hours" data-i18n="hours_4_8">4-8 hours</option>`],
    [`<option value="8-12 hours">8-12 hours</option>`, `<option value="8-12 hours" data-i18n="hours_8_12">8-12 hours</option>`],
    [`<option value="More than 12 hours">More than 12 hours</option>`, `<option value="More than 12 hours" data-i18n="hours_mt_12">More than 12 hours</option>`],
    [`<label>Km driven per day</label>`, `<label data-i18n="lbl_km_day">Km driven per day</label>`],
    [`<label>Km driven per month</label>`, `<label data-i18n="lbl_km_month">Km driven per month</label>`],
    
    // Vehicle types
    [`<span>Petrol Two Wheeler</span>`, `<span data-i18n="vt_petrol_2w">Petrol Two Wheeler</span>`],
    [`<span>Electric Two Wheeler</span>`, `<span data-i18n="vt_electric_2w">Electric Two Wheeler</span>`],
    [`<span>Three Wheeler</span>`, `<span data-i18n="vt_three_w">Three Wheeler</span>`],
    [`<span>Four Wheeler</span>`, `<span data-i18n="vt_four_w">Four Wheeler</span>`],
    [`<option value="">Select Brand/Model</option>`, `<option value="" data-i18n="lbl_select_brand">Select Brand/Model</option>`],

    // Section C
    [`<label>Fuel Type</label>`, `<label data-i18n="lbl_fuel_type">Fuel Type</label>`],
    [`⛽ Petrol</label>`, `⛽ <span data-i18n="fuel_petrol">Petrol</span></label>`],
    [`⛽ Diesel</label>`, `⛽ <span data-i18n="fuel_diesel">Diesel</span></label>`],
    [`💨 CNG</label>`, `💨 <span data-i18n="fuel_cng">CNG</span></label>`],
    [`⚡ Electric</label>`, `⚡ <span data-i18n="fuel_electric">Electric</span></label>`],
    [`<label for="regFuelExp">Weekly Fuel Expense (₹)</label>`, `<label for="regFuelExp" data-i18n="label_fuel_expense">Weekly Fuel Expense (₹)</label>`],
    [`🔌 Public Charging</label>`, `🔌 <span data-i18n="fm_public">Public Charging</span></label>`],
    [`Vehicle Maintenance</h4>`, `<span data-i18n="lbl_maintenance">Vehicle Maintenance</span></h4>`],
    [`<span>Tyre Replacement Frequency</span>`, `<span data-i18n="lbl_tyre">Tyre Replacement Frequency</span>`],
    [`<span>Engine Oil Change Frequency</span>`, `<span data-i18n="lbl_oil">Engine Oil Change Frequency</span>`],
    [`<span>General Servicing Frequency</span>`, `<span data-i18n="lbl_service">General Servicing Frequency</span>`],
    [`<label for="regMaintExp">Overall Monthly Maintenance Cost (₹)</label>`, `<label for="regMaintExp" data-i18n="lbl_maint_cost">Overall Monthly Maintenance Cost (₹)</label>`],
    
    // Frequency dropdowns
    [`<option value="">Select frequency</option>`, `<option value="" data-i18n="lbl_select_freq">Select frequency</option>`],
    [`<option value="Every Month">Every Month</option>`, `<option value="Every Month" data-i18n="freq_month">Every Month</option>`],
    [`<option value="Every 3 Months">Every 3 Months</option>`, `<option value="Every 3 Months" data-i18n="freq_3_months">Every 3 Months</option>`],
    [`<option value="Every 6 Months">Every 6 Months</option>`, `<option value="Every 6 Months" data-i18n="freq_6_months">Every 6 Months</option>`],
    [`<option value="Once a year">Once a year</option>`, `<option value="Once a year" data-i18n="freq_year">Once a year</option>`],
    [`<option value="Rarely">Rarely</option>`, `<option value="Rarely" data-i18n="freq_rarely">Rarely</option>`],

    // Section E
    [`<label>Do you wear a helmet while delivering?</label>`, `<label data-i18n="lbl_helmet">Do you wear a helmet while delivering?</label>`],
    [`🛡️ Always</label>`, `🛡️ <span data-i18n="helm_always">Always</span></label>`],
    [`⚠️ Sometimes</label>`, `⚠️ <span data-i18n="helm_sometimes">Sometimes</span></label>`],
    [`🚫 Never</label>`, `🚫 <span data-i18n="helm_never">Never</span></label>`],
    [`<label>Have you received training for:</label>`, `<label data-i18n="lbl_training">Have you received training for:</label>`],
    [`<span style="margin-left:0.5rem;">Customer Handling</span>`, `<span style="margin-left:0.5rem;" data-i18n="tr_customer">Customer Handling</span>`],
    [`<span style="margin-left:0.5rem;">Accident Response</span>`, `<span style="margin-left:0.5rem;" data-i18n="tr_accident">Accident Response</span>`],
    [`<span style="margin-left:0.5rem;">Vehicle Breakdown</span>`, `<span style="margin-left:0.5rem;" data-i18n="tr_breakdown">Vehicle Breakdown</span>`],
    [`<span style="margin-left:0.5rem;">Emergency Protocols</span>`, `<span style="margin-left:0.5rem;" data-i18n="tr_emergency">Emergency Protocols</span>`],
    
    [`Workplace Facilities</h4>`, `<span data-i18n="lbl_workplace">Workplace Facilities</span></h4>`],
    [`<label>Which of these facilities are provided by your company/platform?</label>`, `<label data-i18n="lbl_facilities">Which of these facilities are provided by your company/platform?</label>`],
    [`<span style="margin-left:0.5rem;">Seating Area</span>`, `<span style="margin-left:0.5rem;" data-i18n="fac_seating">Seating Area</span>`],
    [`<span style="margin-left:0.5rem;">Drinking Water</span>`, `<span style="margin-left:0.5rem;" data-i18n="fac_water">Drinking Water</span>`],
    [`<span style="margin-left:0.5rem;">Clean Toilets</span>`, `<span style="margin-left:0.5rem;" data-i18n="fac_toilets">Clean Toilets</span>`],
    [`<span style="margin-left:0.5rem;">Rest Zones</span>`, `<span style="margin-left:0.5rem;" data-i18n="fac_rest">Rest Zones</span>`]
];

for (const [from, to] of replacements) {
    if (html.includes(from)) {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        html = html.replace(regex, to);
    }
}
fs.writeFileSync('public/index.html', html);
console.log('HTML Patched.');

let appJs = fs.readFileSync('public/js/app.js', 'utf8');
appJs = appJs.replace(
    /<label style="font-size: 0\.85rem; margin-bottom: 0\.2rem;">\$\{platform\} ID<\/label>/g,
    '<label style="font-size: 0.85rem; margin-bottom: 0.2rem;">${window.i18next ? window.i18next.t("plat_" + platform.toLowerCase()) : platform} ${window.i18next ? window.i18next.t("lbl_id") : "ID"}</label>'
);
appJs = appJs.replace(
    /modelSelect\.innerHTML = '<option value="">Select Brand\/Model<\/option>';/g,
    'modelSelect.innerHTML = \'<option value="" data-i18n="lbl_select_brand">\' + (window.i18next ? window.i18next.t("lbl_select_brand") : "Select Brand/Model") + \'</option>\';'
);
fs.writeFileSync('public/js/app.js', appJs);
console.log('app.js Patched.');

const newKeys = {
    plat_swiggy: "Swiggy", plat_zomato: "Zomato", plat_blinkit: "Blinkit", plat_porter: "Porter",
    plat_dunzo: "Dunzo", plat_dhl: "DHL", plat_amazon: "Amazon", plat_flipkart: "Flipkart",
    plat_zepto: "Zepto", plat_other: "Other", lbl_id: "ID",
    exp_0_6: "0-6 months", exp_1_2: "1-2 Years", exp_2_3: "2-3 Years", exp_3_4: "3-4 Years",
    exp_4_5: "4-5 Years", exp_5_6: "5-6 Years", exp_6_plus: "6+ Years",
    vt_petrol_2w: "Petrol Two Wheeler", vt_three_w: "Three Wheeler", vt_electric_2w: "Electric Two Wheeler",
    vt_four_w: "Four Wheeler", lbl_select_brand: "Select Brand/Model",
    lbl_ownership: "Vehicle Ownership", own_own: "Own", own_rented: "Rented",
    lbl_weekly_rent: "Weekly Rent (₹)", lbl_monthly_rent: "Monthly Rent (₹)",
    lbl_hours: "How many hours do you work daily?", lbl_select_hours: "Select Working Hours",
    hours_lt_4: "Less than 4 hours", hours_4_8: "4-8 hours", hours_8_12: "8-12 hours", hours_mt_12: "More than 12 hours",
    lbl_km_day: "Km driven per day", lbl_km_month: "Km driven per month",
    lbl_fuel_type: "Fuel Type", fuel_petrol: "Petrol", fuel_diesel: "Diesel", fuel_cng: "CNG", fuel_electric: "Electric", fm_public: "Public Charging",
    lbl_maintenance: "Vehicle Maintenance", lbl_tyre: "Tyre Replacement Frequency", lbl_oil: "Engine Oil Change Frequency",
    lbl_service: "General Servicing Frequency", lbl_maint_cost: "Overall Monthly Maintenance Cost (₹)",
    lbl_select_freq: "Select frequency", freq_month: "Every Month", freq_3_months: "Every 3 Months",
    freq_6_months: "Every 6 Months", freq_year: "Once a year", freq_rarely: "Rarely",
    lbl_helmet: "Do you wear a helmet while delivering?", helm_always: "Always", helm_sometimes: "Sometimes", helm_never: "Never",
    lbl_training: "Have you received training for:", tr_customer: "Customer Handling", tr_accident: "Accident Response",
    tr_breakdown: "Vehicle Breakdown", tr_emergency: "Emergency Protocols",
    lbl_workplace: "Workplace Facilities", lbl_facilities: "Which of these facilities are provided by your company/platform?",
    fac_seating: "Seating Area", fac_water: "Drinking Water", fac_toilets: "Clean Toilets", fac_rest: "Rest Zones"
};

const commonEnFile = 'public/locales/en/common.json';
const commonEn = JSON.parse(fs.readFileSync(commonEnFile, 'utf8'));

let added = false;
for (const [k, v] of Object.entries(newKeys)) {
    if (!commonEn.hasOwnProperty(k)) {
        commonEn[k] = v;
        added = true;
    }
}

if (added) {
    fs.writeFileSync(commonEnFile, JSON.stringify(commonEn, null, 4));
    console.log("Updated public/locales/en/common.json");
}
