import re
import json

file_path = 'public/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Maintenance questions
replacements = [
    ('<label>1. Who pays for regular servicing?</label>', '<label data-i18n="lbl_maint_own_1">1. Who pays for regular servicing?</label>'),
    ('<label>2. Who pays for puncture repairs?</label>', '<label data-i18n="lbl_maint_own_2">2. Who pays for puncture repairs?</label>'),
    ('<label>3. Who pays for wear and tear (wire replacement, brake pads, clutch, etc.)?</label>', '<label data-i18n="lbl_maint_own_3">3. Who pays for wear and tear (wire replacement, brake pads, clutch, etc.)?</label>'),
    ('<label>4. In case of an accident, who bears the repair expenses?</label>', '<label data-i18n="lbl_maint_own_4">4. In case of an accident, who bears the repair expenses?</label>'),
    ('<label>5. Is your vehicle insured?</label>', '<label data-i18n="lbl_maint_own_5">5. Is your vehicle insured?</label>'),
    ('<label>6. How often do you service your vehicle?</label>', '<label data-i18n="lbl_maint_own_6">6. How often do you service your vehicle?</label>'),
    ('<label>1. Before renting the vehicle, did you check its service history?</label>', '<label data-i18n="lbl_maint_rent_1">1. Before renting the vehicle, did you check its service history?</label>'),
    ('<label>2. Before taking the vehicle, did you inspect the condition of the tyres?</label>', '<label data-i18n="lbl_maint_rent_2">2. Before taking the vehicle, did you inspect the condition of the tyres?</label>'),
    ('<label>3. Did you check the brakes before taking the vehicle?</label>', '<label data-i18n="lbl_maint_rent_3">3. Did you check the brakes before taking the vehicle?</label>'),
    ('<label>4. Did you check the lights and indicators?</label>', '<label data-i18n="lbl_maint_rent_4">4. Did you check the lights and indicators?</label>'),
    ('<label>5. If the rented vehicle gets damaged during work, who pays?</label>', '<label data-i18n="lbl_maint_rent_5">5. If the rented vehicle gets damaged during work, who pays?</label>'),
    ('<label>6. If the vehicle meets with an accident, who covers the repair expenses?</label>', '<label data-i18n="lbl_maint_rent_6">6. If the vehicle meets with an accident, who covers the repair expenses?</label>'),
    ('<label>7. Is insurance included with the rental vehicle?</label>', '<label data-i18n="lbl_maint_rent_7">7. Is insurance included with the rental vehicle?</label>'),
    ('<label>1. Who pays for maintenance?</label>', '<label data-i18n="lbl_maint_comp_1">1. Who pays for maintenance?</label>'),
    ('<label>2. Is insurance provided by the company?</label>', '<label data-i18n="lbl_maint_comp_2">2. Is insurance provided by the company?</label>'),
    ('<label>3. If the vehicle is damaged during delivery, who pays?</label>', '<label data-i18n="lbl_maint_comp_3">3. If the vehicle is damaged during delivery, who pays?</label>'),
    ('<label>4. If there is an accident, who pays for repairs?</label>', '<label data-i18n="lbl_maint_comp_4">4. If there is an accident, who pays for repairs?</label>')
]

for old, new in replacements:
    content = content.replace(old, new)

# Replace options: <label class="radio-item"><input ...> Text</label> -> <label class="radio-item"><input ...> <span data-i18n="key">Text</span></label>
# I'll use regex to wrap the trailing text in <span> for the radio buttons in the sections.

# Update json
json_path = 'public/locales/en/common.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

new_keys = {
    "lbl_maint_own_1": "1. Who pays for regular servicing?",
    "lbl_maint_own_2": "2. Who pays for puncture repairs?",
    "lbl_maint_own_3": "3. Who pays for wear and tear (wire replacement, brake pads, clutch, etc.)?",
    "lbl_maint_own_4": "4. In case of an accident, who bears the repair expenses?",
    "lbl_maint_own_5": "5. Is your vehicle insured?",
    "lbl_maint_own_6": "6. How often do you service your vehicle?",
    "lbl_maint_rent_1": "1. Before renting the vehicle, did you check its service history?",
    "lbl_maint_rent_2": "2. Before taking the vehicle, did you inspect the condition of the tyres?",
    "lbl_maint_rent_3": "3. Did you check the brakes before taking the vehicle?",
    "lbl_maint_rent_4": "4. Did you check the lights and indicators?",
    "lbl_maint_rent_5": "5. If the rented vehicle gets damaged during work, who pays?",
    "lbl_maint_rent_6": "6. If the vehicle meets with an accident, who covers the repair expenses?",
    "lbl_maint_rent_7": "7. Is insurance included with the rental vehicle?",
    "lbl_maint_comp_1": "1. Who pays for maintenance?",
    "lbl_maint_comp_2": "2. Is insurance provided by the company?",
    "lbl_maint_comp_3": "3. If the vehicle is damaged during delivery, who pays?",
    "lbl_maint_comp_4": "4. If there is an accident, who pays for repairs?",
    "train_greeting": "Customer Greeting & Professional Behaviour",
    "train_complaints": "Handling Customer Complaints / Grievances",
    "train_accident": "What to Do in Case of an Accident",
    "train_rto": "RTO Rules and Traffic Regulations",
    "train_roadside": "Roadside Assistance / Vehicle Breakdown Procedure",
    "train_delays": "Handling Delivery Delays",
    "train_driving": "Safe Driving Practices",
    "train_sos": "Emergency Contact & SOS Procedure",
    "train_inspection": "Vehicle Inspection Before Starting Work",
    "train_platform": "Delivery Platform Rules & Guidelines",
    "train_payment": "Digital Payment & Cash Handling",
    "train_safety": "Personal Safety During Deliveries",
    "train_none": "I Have Not Received Any Training"
}

for k, v in new_keys.items():
    if k not in data:
        data[k] = v

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
