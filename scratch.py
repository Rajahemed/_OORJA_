import sys, re

path = r'd:\Road-Warrior\public\js\i18n.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# English replacements
en_additions = '''sec_d_title:"Section D — Challenges & Pain Points",
            label_petrol_challenges:"Petrol Specific Challenges",
            label_ev_challenges:"EV Specific Challenges",
            ch_traffic:"Traffic Police",
            ch_rto:"RTO",
            ch_challans:"Challans",
            ch_parking:"Parking Issues",
            ch_documents:"Vehicle Documents",
            q_fuel_cost:"Is fuel cost a major challenge for you?",
            opt_yes:"Yes",
            opt_no:"No",'''

text = re.sub(r'sec_d_title:\"Section D — Challenges & Pain Points\",', en_additions, text, count=1)


# Hindi replacements
hi_additions = '''sec_d_title:"खंड D — चुनौतियां",
            label_petrol_challenges:"पेट्रोल विशिष्ट चुनौतियां",
            label_ev_challenges:"EV विशिष्ट चुनौतियां",
            ch_traffic:"ट्रैफिक पुलिस",
            ch_rto:"RTO",
            ch_challans:"चालान",
            ch_parking:"पार्किंग की समस्या",
            ch_documents:"वाहन के कागजात",
            q_fuel_cost:"क्या ईंधन की कीमत आपके लिए एक बड़ी चुनौती है?",
            opt_yes:"हाँ",
            opt_no:"नहीं",'''

text = re.sub(r'sec_d_title:\"खंड D — बीमा\",', hi_additions, text, count=1)


# Kannada replacements
kn_additions = '''sec_d_title:"ವಿಭಾಗ D — ಸವಾಲುಗಳು",
            label_petrol_challenges:"ಪೆಟ್ರೋಲ್ ನಿರ್ದಿಷ್ಟ ಸವಾಲುಗಳು",
            label_ev_challenges:"EV ನಿರ್ದಿಷ್ಟ ಸವಾಲುಗಳು",
            ch_traffic:"ಟ್ರಾಫಿಕ್ ಪೊಲೀಸ್",
            ch_rto:"RTO",
            ch_challans:"ಚಲನ್ಗಳು",
            ch_parking:"ಪಾರ್ಕಿಂಗ್ ಸಮಸ್ಯೆಗಳು",
            ch_documents:"ವಾಹನ ದಾಖಲೆಗಳು",
            q_fuel_cost:"ಇಂಧನ ವೆಚ್ಚವು ನಿಮಗೆ ದೊಡ್ಡ ಸವಾಲಾಗಿದೆಯೇ?",
            opt_yes:"ಹೌದು",
            opt_no:"ಇಲ್ಲ",'''

text = re.sub(r'sec_d_title:\"ವಿಭಾಗ D — ವಿಮೆ\",', kn_additions, text, count=1)


with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Success!')
