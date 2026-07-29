const axios = require('axios');

class CRMService {
    constructor() {
        this.hubspotKey = process.env.HUBSPOT_API_KEY;
        this.zohoToken = process.env.ZOHO_API_TOKEN;
        this.pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
        this.webhookUrl = process.env.CRM_WEBHOOK_URL;
    }

    async sendLead(leadData) {
        const promises = [];

        if (this.hubspotKey) promises.push(this.sendToHubSpot(leadData));
        if (this.zohoToken) promises.push(this.sendToZoho(leadData));
        if (this.pipedriveToken) promises.push(this.sendToPipedrive(leadData));
        if (this.webhookUrl) promises.push(this.sendToWebhook(leadData));

        if (promises.length === 0) {
            console.log('[CRM] No CRM configured. Lead not sent.');
            return;
        }

        try {
            await Promise.allSettled(promises);
            console.log('[CRM] Lead successfully dispatched to configured CRMs.');
        } catch (error) {
            console.error('[CRM] Error sending lead to one or more CRMs:', error);
        }
    }

    async sendToHubSpot(data) {
        // Simple mapping example
        const payload = {
            properties: [
                { property: 'firstname', value: data.name },
                { property: 'email', value: data.email },
                { property: 'website', value: data.website }
            ]
        };
        await axios.post(`https://api.hubapi.com/contacts/v1/contact/?hapikey=${this.hubspotKey}`, payload);
    }

    async sendToZoho(data) {
        const payload = {
            data: [{
                Last_Name: data.name,
                Email: data.email,
                Website: data.website
            }]
        };
        await axios.post('https://www.zohoapis.com/crm/v2/Leads', payload, {
            headers: { 'Authorization': `Zoho-oauthtoken ${this.zohoToken}` }
        });
    }

    async sendToPipedrive(data) {
        const payload = {
            name: data.name,
            email: [{ value: data.email, primary: true }]
        };
        // 1. Create Person
        const personRes = await axios.post(`https://api.pipedrive.com/v1/persons?api_token=${this.pipedriveToken}`, payload);
        // 2. Create Lead/Deal for the person
        if (personRes.data && personRes.data.data) {
            await axios.post(`https://api.pipedrive.com/v1/deals?api_token=${this.pipedriveToken}`, {
                title: `Deal with ${data.name} - ${data.website}`,
                person_id: personRes.data.data.id
            });
        }
    }

    async sendToWebhook(data) {
        await axios.post(this.webhookUrl, data);
    }
}

module.exports = new CRMService();
