const INSURANCE_CONFIG = {
  question: 'Are you currently covered by any of the following insurance?',
  question_i18n: 'ins_question',
  groups: [
    {
      title: 'Personal Insurance',
      title_i18n: 'ins_group_personal',
      options: [
        { id: 'opd', label: 'OPD Insurance', label_i18n: 'ins_opd' },
        { id: 'mediclaim', label: 'Mediclaim / Health Insurance', label_i18n: 'ins_mediclaim' },
        { id: 'life', label: 'Life Insurance', label_i18n: 'ins_life' },
        { id: 'pa', label: 'Personal Accident Insurance (PA)', label_i18n: 'ins_pa' },
        { id: 'none_personal', label: 'None of the Above', label_i18n: 'ins_none' }
      ]
    },
    {
      title: 'Vehicle Insurance',
      title_i18n: 'ins_group_vehicle',
      options: [
        { id: 'third_party', label: 'Vehicle Third-Party Insurance', label_i18n: 'ins_third_party' },
        { id: 'od', label: 'Vehicle Own Damage (OD) Insurance', label_i18n: 'ins_od' },
        { id: 'comprehensive', label: 'Comprehensive Vehicle Insurance (Third-Party + OD)', label_i18n: 'ins_comp' },
        { id: 'none_vehicle', label: 'None of the Above', label_i18n: 'ins_none' }
      ]
    }
  ],
  noneOption: { id: 'none', label: 'None of the Above', label_i18n: 'ins_none' }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = INSURANCE_CONFIG;
}
