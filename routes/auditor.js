const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');

// Website Auditor Mock Engine
function runAuditorChecks(url) {
  // Generate random mock scores between 50 and 99 for demo
  const randScore = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  
  const seoScore = randScore(60, 95);
  const performanceScore = randScore(50, 98);
  const securityScore = randScore(70, 100);
  const aiReadinessScore = randScore(40, 90);
  const trustScore = randScore(60, 95);

  const overallScore = Math.floor((seoScore + performanceScore + securityScore + aiReadinessScore + trustScore) / 5);

  const checks = [
    { category: 'MEASUREMENT', name: 'Google Analytics 4', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'info' },
    { category: 'MEASUREMENT', name: 'Google Tag Manager', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'info' },
    { category: 'MEASUREMENT', name: 'Microsoft Clarity', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'info' },
    { category: 'MEASUREMENT', name: 'Hotjar', status: 'Fail', type: 'info' },
    { category: 'RETARGETING', name: 'Meta Pixel', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'info' },
    { category: 'RETARGETING', name: 'Google Ads Tag', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'info' },
    { category: 'RETARGETING', name: 'LinkedIn Tag', status: 'Fail', type: 'info' },
    { category: 'CONVERSION', name: 'WhatsApp Button', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'success' },
    { category: 'CONVERSION', name: 'Lead Form', status: 'Pass', type: 'success' },
    { category: 'CONVERSION', name: 'Click To Call', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'success' },
    { category: 'CONVERSION', name: 'Live Chat', status: 'Fail', type: 'success' },
    { category: 'CONVERSION', name: 'Exit Intent Popup', status: 'Fail', type: 'success' },
    { category: 'TRUST', name: 'SSL Certificate', status: 'Pass', type: 'success' },
    { category: 'TRUST', name: 'Privacy Policy Page', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'TRUST', name: 'Customer Reviews', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'TRUST', name: 'Contact Info', status: 'Pass', type: 'success' },
    { category: 'TRUST', name: 'Business Address', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'Schema Markup', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'Open Graph Tags', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'Meta Description', status: 'Pass', type: 'success' },
    { category: 'SEO + AI', name: 'Sitemap.xml', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'Canonical Tags', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'Favicon', status: 'Pass', type: 'success' },
    { category: 'SEO + AI', name: 'H1 Structure', status: randScore(0,1)>0 ? 'Pass' : 'Fail', type: 'warning' },
    { category: 'SEO + AI', name: 'llms.txt', status: aiReadinessScore > 75 ? 'Pass' : 'Fail', type: 'warning' }
  ];

  return {
    url,
    overallScore,
    scores: {
      seo: seoScore,
      performance: performanceScore,
      security: securityScore,
      aiReadiness: aiReadinessScore,
      trust: trustScore
    },
    checks,
    recommendations: [
      aiReadinessScore < 75 ? "Create an llms.txt file to improve AI Search Engine visibility (ChatGPT, Perplexity)." : null,
      securityScore < 80 ? "Implement strict Content Security Policy headers." : null,
      "Ensure all images are lazy-loaded to improve performance.",
      "Add structured data Schema.org markup to the homepage."
    ].filter(Boolean)
  };
}

// POST: Run a new audit
router.post('/run', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required for audit' });
    }

    const reportId = uuidv4();
    const result = runAuditorChecks(url);
    const report = {
      id: reportId,
      url: result.url,
      overallScore: result.overallScore,
      scores: result.scores,
      checks: result.checks,
      recommendations: result.recommendations,
      timestamp: new Date()
    };

    await supabase.from('auditReports').insert(report);

    res.json({
      success: true,
      message: 'Audit completed successfully',
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: List recent audits
router.get('/reports', async (req, res) => {
  try {
    const { data: reports, error } = await supabase.from('auditReports').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: reports || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
