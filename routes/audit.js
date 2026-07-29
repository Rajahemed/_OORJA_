const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const crmService = require('../utils/crmService');

router.post('/audit-domain', async (req, res) => {
  try {
    const { domain, name, email } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    // Capture Lead
    if (email) {
      // Don't wait for CRM to finish to keep UX fast
      crmService.sendLead({ name: name || 'Unknown', email, website: domain });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    const results = {
      domain: cleanDomain,
      spf: { status: 'missing', record: null },
      dkim: { status: 'missing', record: null },
      dmarc: { status: 'missing', record: null }
    };

    try {
      const txtRecords = await dns.resolveTxt(cleanDomain);
      const flatRecords = txtRecords.map(r => r.join(''));
      
      const spfRecord = flatRecords.find(r => r.startsWith('v=spf1'));
      if (spfRecord) {
        results.spf.status = 'pass';
        results.spf.record = spfRecord;
      }
    } catch (e) {
      // Ignore if no TXT records
    }

    try {
      // Common DKIM selector check (default selector). This is a best effort without knowing the actual selector.
      const dkimRecords = await dns.resolveTxt('default._domainkey.' + cleanDomain);
      const flatRecords = dkimRecords.map(r => r.join(''));
      const dkimRecord = flatRecords.find(r => r.startsWith('v=DKIM1'));
      if (dkimRecord) {
        results.dkim.status = 'pass';
        results.dkim.record = dkimRecord;
      }
    } catch (e) {
      // Ignore if no DKIM record on default selector
    }

    try {
      const dmarcRecords = await dns.resolveTxt('_dmarc.' + cleanDomain);
      const flatRecords = dmarcRecords.map(r => r.join(''));
      const dmarcRecord = flatRecords.find(r => r.startsWith('v=DMARC1'));
      if (dmarcRecord) {
        results.dmarc.status = 'pass';
        results.dmarc.record = dmarcRecord;
      }
    } catch (e) {
      // Ignore if no DMARC record
    }

    res.json(results);
  } catch (error) {
    console.error('Audit Error:', error);
    res.status(500).json({ error: 'Failed to perform audit' });
  }
});

module.exports = router;
