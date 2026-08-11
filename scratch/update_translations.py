import json
import os

locales_dir = r"d:\Road-Warrior\public\locales"

new_keys_en = {
    "ins_question": "Are you currently covered by any of the following insurance?",
    "ins_group_personal": "Personal Insurance",
    "ins_opd": "OPD Insurance",
    "ins_mediclaim": "Mediclaim / Health Insurance",
    "ins_life": "Life Insurance",
    "ins_pa": "Personal Accident Insurance (PA)",
    "ins_group_vehicle": "Vehicle Insurance",
    "ins_third_party": "Vehicle Third-Party Insurance",
    "ins_od": "Vehicle Own Damage (OD) Insurance",
    "ins_comp": "Comprehensive Vehicle Insurance (Third-Party + OD)",
    "ins_none": "None of the Above",
    
    "lbl_workplace": "Workplace Facilities",
    "fac_seating": "Seating Area",
    "fac_water": "Drinking Water",
    "fac_toilets": "Clean Toilets",
    "fac_rest": "Rest Zones",
    "fac_none": "None of the Above",
    
    "lbl_training": "Have you received training on the following topics?",
    "train_greeting": "Customer Greeting & Professional Behaviour",
    "train_complaints": "Handling Customer Complaints / Grievances",
    "train_accident": "What to Do in Case of an Accident",
    "train_rto": "RTO Rules and Traffic Regulations",
    "train_roadside": "Roadside Assistance / Vehicle Breakdown Procedure",
    "train_inspection": "Vehicle Inspection Before Starting Work",
    "train_none": "I Have Not Received Any Training"
}

new_keys_hi = {
    "ins_question": "क्या आप वर्तमान में निम्नलिखित में से किसी भी बीमा द्वारा कवर किए गए हैं?",
    "ins_group_personal": "व्यक्तिगत बीमा",
    "ins_opd": "OPD बीमा",
    "ins_mediclaim": "मेडिक्लेम / स्वास्थ्य बीमा",
    "ins_life": "जीवन बीमा",
    "ins_pa": "व्यक्तिगत दुर्घटना बीमा (PA)",
    "ins_group_vehicle": "वाहन बीमा",
    "ins_third_party": "वाहन थर्ड-पार्टी बीमा",
    "ins_od": "वाहन ओन डैमेज (OD) बीमा",
    "ins_comp": "व्यापक वाहन बीमा (थर्ड-पार्टी + OD)",
    "ins_none": "इनमें से कोई नहीं",
    
    "lbl_workplace": "कार्यस्थल की सुविधाएँ",
    "fac_seating": "बैठने की जगह",
    "fac_water": "पीने का पानी",
    "fac_toilets": "स्वच्छ शौचालय",
    "fac_rest": "आराम क्षेत्र",
    "fac_none": "इनमें से कोई नहीं",
    
    "lbl_training": "क्या आपने निम्नलिखित विषयों पर प्रशिक्षण प्राप्त किया है?",
    "train_greeting": "ग्राहक अभिवादन और पेशेवर व्यवहार",
    "train_complaints": "ग्राहक शिकायतों / शिकायतों को संभालना",
    "train_accident": "दुर्घटना की स्थिति में क्या करें",
    "train_rto": "RTO नियम और यातायात नियम",
    "train_roadside": "सड़क के किनारे सहायता / वाहन टूटने की प्रक्रिया",
    "train_inspection": "काम शुरू करने से पहले वाहन का निरीक्षण",
    "train_none": "मुझे कोई प्रशिक्षण नहीं मिला है"
}

new_keys_kn = {
    "ins_question": "ನೀವು ಪ್ರಸ್ತುತ ಈ ಕೆಳಗಿನ ಯಾವುದೇ ವಿಮೆಯಿಂದ ರಕ್ಷಣೆ ಹೊಂದಿದ್ದೀರಾ?",
    "ins_group_personal": "ವೈಯಕ್ತಿಕ ವಿಮೆ",
    "ins_opd": "OPD ವಿಮೆ",
    "ins_mediclaim": "ಮೆಡಿಕ್ಲೈಮ್ / ಆರೋಗ್ಯ ವಿಮೆ",
    "ins_life": "ಜೀವ ವಿಮೆ",
    "ins_pa": "ವೈಯಕ್ತಿಕ ಅಪಘಾತ ವಿಮೆ (PA)",
    "ins_group_vehicle": "ವಾಹನ ವಿಮೆ",
    "ins_third_party": "ವಾಹನ ಥರ್ಡ್-ಪಾರ್ಟಿ ವಿಮೆ",
    "ins_od": "ವಾಹನ ಓನ್ ಡ್ಯಾಮೇಜ್ (OD) ವಿಮೆ",
    "ins_comp": "ಸಮಗ್ರ ವಾಹನ ವಿಮೆ (ಥರ್ಡ್-ಪಾರ್ಟಿ + OD)",
    "ins_none": "ಇವುಗಳಲ್ಲಿ ಯಾವುದೂ ಅಲ್ಲ",
    
    "lbl_workplace": "ಕೆಲಸದ ಸ್ಥಳದ ಸೌಲಭ್ಯಗಳು",
    "fac_seating": "ಕುಳಿತುಕೊಳ್ಳುವ ಸ್ಥಳ",
    "fac_water": "ಕುಡಿಯುವ ನೀರು",
    "fac_toilets": "ಸ್ವಚ್ಛ ಶೌಚಾಲಯಗಳು",
    "fac_rest": "ವಿಶ್ರಾಂತಿ ವಲಯಗಳು",
    "fac_none": "ಇವುಗಳಲ್ಲಿ ಯಾವುದೂ ಅಲ್ಲ",
    
    "lbl_training": "ನೀವು ಈ ಕೆಳಗಿನ ವಿಷಯಗಳ ಬಗ್ಗೆ ತರಬೇತಿ ಪಡೆದಿದ್ದೀರಾ?",
    "train_greeting": "ಗ್ರಾಹಕರ ಸ್ವಾಗತ ಮತ್ತು ವೃತ್ತಿಪರ ನಡವಳಿಕೆ",
    "train_complaints": "ಗ್ರಾಹಕರ ದೂರುಗಳನ್ನು ನಿಭಾಯಿಸುವುದು",
    "train_accident": "ಅಪಘಾತದ ಸಂದರ್ಭದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು",
    "train_rto": "RTO ನಿಯಮಗಳು ಮತ್ತು ಸಂಚಾರ ನಿಯಮಗಳು",
    "train_roadside": "ರಸ್ತೆಬದಿಯ ನೆರವು / ವಾಹನ ಕೆಟ್ಟುಹೋದಾಗ ಪ್ರಕ್ರಿಯೆ",
    "train_inspection": "ಕೆಲಸ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ವಾಹನ ತಪಾಸಣೆ",
    "train_none": "ನಾನು ಯಾವುದೇ ತರಬೇತಿ ಪಡೆದಿಲ್ಲ"
}

for lang in os.listdir(locales_dir):
    lang_dir = os.path.join(locales_dir, lang)
    if os.path.isdir(lang_dir):
        json_path = os.path.join(lang_dir, "common.json")
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    print(f"Error reading {json_path}")
                    continue
            
            # Select appropriate translation mapping
            keys_to_add = new_keys_en
            if lang == "hi":
                keys_to_add = new_keys_hi
            elif lang == "kn":
                keys_to_add = new_keys_kn
                
            updated = False
            for k, v in keys_to_add.items():
                if k not in data or data[k] == "" or data[k] == k:
                    data[k] = v
                    updated = True
            
            if updated:
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"Updated {lang}/common.json")
            else:
                print(f"No updates needed for {lang}/common.json")
