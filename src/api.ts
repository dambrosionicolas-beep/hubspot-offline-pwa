import type { Contact, Company, Deal, Ticket, Activity } from './db';

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockActivities = (count: number, contactId?: string, companyId?: string, dealId?: string, ticketId?: string): Activity[] => {
    return Array.from({ length: count }).map(() => {
        const types: Activity['type'][] = ['note', 'call', 'email', 'meeting'];
        const type = types[Math.floor(Math.random() * types.length)];
        let content = '';

        switch (type) {
            case 'note':
                content = 'Customer mentioned interest in the new product line.';
                break;
            case 'call':
                content = 'Outbound call: Discussed contract renewal. Outcome: Connected.';
                break;
            case 'email':
                content = 'Subject: Follow up on our meeting. Body: Hi, just checking in...';
                break;
            case 'meeting':
                content = 'Demo with the engineering team.';
                break;
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content,
            timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
            contactId,
            companyId,
            dealId,
            ticketId,
            syncStatus: 'synced',
            updatedAt: Date.now()
        };
    });
};

const HUBSPOT_API_BASE = '/api/hubspot/crm/v3/objects';

const getApiKey = () => localStorage.getItem('hubspot_api_key');

const hubspotRequest = async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', body?: any) => {
    const token = getApiKey();
    if (!token) throw new Error('No API Key');

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        throw new Error(`HubSpot API Error: ${response.statusText}`);
    }

    if (method === 'DELETE') return;
    return await response.json();
};

const fetchAll = async (endpoint: string): Promise<any[]> => {
    let results: any[] = [];
    let after: string | undefined = undefined;

    do {
        const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=100${after ? `&after=${after}` : ''}`;
        const data = await hubspotRequest(url);
        results = [...results, ...data.results];
        after = data.paging?.next?.after;
    } while (after);

    return results;
};

// Cache for pipeline stages and labels
interface PipelineInfo {
    label: string;
    stages: Record<string, string>;
}
let pipelineCache: Record<string, PipelineInfo> | null = null;

const getPipelineInfo = async (pipelineId: string, stageId: string): Promise<{ pipelineLabel: string, stageLabel: string }> => {
    if (!pipelineCache) {
        try {
            const pipelines = await hubspotRequest('/pipelines/deals');
            pipelineCache = {};
            pipelines.results.forEach((p: any) => {
                const stages: Record<string, string> = {};
                p.stages.forEach((s: any) => {
                    stages[s.id] = s.label;
                });
                pipelineCache![p.id] = {
                    label: p.label,
                    stages: stages
                };
            });
        } catch (e) {
            console.error('Failed to fetch pipelines', e);
            return { pipelineLabel: pipelineId, stageLabel: stageId };
        }
    }

    const pipeline = pipelineCache?.[pipelineId];
    return {
        pipelineLabel: pipeline?.label || pipelineId,
        stageLabel: pipeline?.stages?.[stageId] || stageId
    };
};

export const api = {
    // --- Contacts ---
    fetchContacts: async (): Promise<Contact[]> => {
        if (!getApiKey()) {
            await delay(1000);
            return [
                { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', companyId: '101', syncStatus: 'synced', updatedAt: Date.now() },
                { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', companyId: '102', syncStatus: 'synced', updatedAt: Date.now() }
            ];
        }

        try {
            const properties = [
                'firstname', 'lastname', 'email', 'phone', 'company',
                'address', 'city', 'country', 'createdate', 'cv',
                'dans_quelle_fourchette_se_situe_votre_budget__', 'fax', 'gender',
                'grader_consent_to_communicate', 'hubspot_owner_assigneddate',
                'hubspot_owner_id', 'hubspot_team_id', 'hubspotscore', 'industry',
                'job_function', 'jobtitle', 'lifecyclestage', 'linkedin', 'message',
                'mobilephone', 'nombre_de_flux_souhaites', 'notes_last_contacted',
                'notes_last_updated', 'notes_next_activity_date', 'num_associated_deals',
                'num_contacted_notes', 'num_notes', 'number_of_associated_companies',
                'numemployees', 'recent_deal_amount', 'recent_deal_close_date',
                'salutation', 'state', 'statut_du_recrutement', 'total_revenue',
                'type_de_demo', 'type_de_formation', 'url_du_dernier_devis_publie',
                'website', 'work_email'
            ].join(',');

            const results = await fetchAll(`/contacts?properties=${properties}`);

            return results.map((item: any) => ({
                id: item.id,
                firstName: item.properties.firstname || '',
                lastName: item.properties.lastname || '',
                email: item.properties.email || '',
                phone: item.properties.phone || '',
                companyId: item.properties.company || '',

                // Extended fields
                address: item.properties.address,
                city: item.properties.city,
                company: item.properties.company,
                country: item.properties.country,
                createdate: item.properties.createdate,
                cv: item.properties.cv,
                dans_quelle_fourchette_se_situe_votre_budget__: item.properties.dans_quelle_fourchette_se_situe_votre_budget__,
                fax: item.properties.fax,
                gender: item.properties.gender,
                grader_consent_to_communicate: item.properties.grader_consent_to_communicate,
                hubspot_owner_assigneddate: item.properties.hubspot_owner_assigneddate,
                hubspot_owner_id: item.properties.hubspot_owner_id,
                hubspot_team_id: item.properties.hubspot_team_id,
                hubspotscore: item.properties.hubspotscore,
                industry: item.properties.industry,
                job_function: item.properties.job_function,
                jobtitle: item.properties.jobtitle,
                lifecyclestage: item.properties.lifecyclestage,
                linkedin: item.properties.linkedin,
                message: item.properties.message,
                mobilephone: item.properties.mobilephone,
                nombre_de_flux_souhaites: item.properties.nombre_de_flux_souhaites,
                notes_last_contacted: item.properties.notes_last_contacted,
                notes_last_updated: item.properties.notes_last_updated,
                notes_next_activity_date: item.properties.notes_next_activity_date,
                num_associated_deals: item.properties.num_associated_deals,
                num_contacted_notes: item.properties.num_contacted_notes,
                num_notes: item.properties.num_notes,
                number_of_associated_companies: item.properties.number_of_associated_companies,
                numemployees: item.properties.numemployees,
                recent_deal_amount: item.properties.recent_deal_amount,
                recent_deal_close_date: item.properties.recent_deal_close_date,
                salutation: item.properties.salutation,
                state: item.properties.state,
                statut_du_recrutement: item.properties.statut_du_recrutement,
                total_revenue: item.properties.total_revenue,
                type_de_demo: item.properties.type_de_demo,
                type_de_formation: item.properties.type_de_formation,
                url_du_dernier_devis_publie: item.properties.url_du_dernier_devis_publie,
                website: item.properties.website,
                work_email: item.properties.work_email,

                syncStatus: 'synced',
                updatedAt: new Date(item.updatedAt).getTime()
            }));
        } catch (error) {
            console.error('API Fetch Error', error);
            throw error;
        }
    },

    createContact: async (contact: Omit<Contact, 'id' | 'syncStatus' | 'updatedAt'>): Promise<Contact> => {
        if (!getApiKey()) {
            await delay(500);
            return { ...contact, id: Math.random().toString(36).substr(2, 9), syncStatus: 'synced', updatedAt: Date.now() };
        }

        const properties = {
            firstname: contact.firstName,
            lastname: contact.lastName,
            email: contact.email,
            phone: contact.phone
        };
        const data = await hubspotRequest('/contacts', 'POST', { properties });
        return { ...contact, id: data.id, syncStatus: 'synced', updatedAt: Date.now() };
    },

    updateContact: async (id: string, updates: Partial<Contact>): Promise<Contact> => {
        if (!getApiKey()) {
            await delay(500);
            return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Contact;
        }

        const properties: any = {};
        if (updates.firstName) properties.firstname = updates.firstName;
        if (updates.lastName) properties.lastname = updates.lastName;
        if (updates.email) properties.email = updates.email;
        if (updates.phone) properties.phone = updates.phone;

        await hubspotRequest(`/contacts/${id}`, 'PATCH', { properties });
        return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Contact;
    },

    deleteContact: async (id: string): Promise<void> => {
        if (!getApiKey()) {
            await delay(500);
            console.log(`Deleted contact ${id}`);
            return;
        }
        await hubspotRequest(`/contacts/${id}`, 'DELETE');
    },

    // --- Companies ---
    fetchCompanies: async (): Promise<Company[]> => {
        if (!getApiKey()) {
            await delay(1000);
            return [
                { id: '101', name: 'Acme Corp', domain: 'acme.com', syncStatus: 'synced', updatedAt: Date.now() },
                { id: '102', name: 'Globex', domain: 'globex.com', syncStatus: 'synced', updatedAt: Date.now() }
            ];
        }

        try {
            const properties = [
                'name', 'domain', 'industry',
                'address', 'address2', 'annualrevenue', 'city', 'closedate', 'country',
                'createdate', 'description', 'founded_year', 'lifecyclestage',
                'numberofemployees', 'numero_de_siret', 'phone', 'recent_deal_amount',
                'recent_deal_close_date', 'sales_owner_hubspot', 'state', 'type',
                'website', 'zip'
            ].join(',');

            const results = await fetchAll(`/companies?properties=${properties}`);
            return results.map((item: any) => ({
                id: item.id,
                name: item.properties.name || '',
                domain: item.properties.domain || '',
                industry: item.properties.industry || '',

                // Extended fields
                address: item.properties.address,
                address2: item.properties.address2,
                annualrevenue: item.properties.annualrevenue,
                city: item.properties.city,
                closedate: item.properties.closedate,
                country: item.properties.country,
                createdate: item.properties.createdate,
                description: item.properties.description,
                founded_year: item.properties.founded_year,
                lifecyclestage: item.properties.lifecyclestage,
                numberofemployees: item.properties.numberofemployees,
                numero_de_siret: item.properties.numero_de_siret,
                phone: item.properties.phone,
                recent_deal_amount: item.properties.recent_deal_amount,
                recent_deal_close_date: item.properties.recent_deal_close_date,
                sales_owner_hubspot: item.properties.sales_owner_hubspot,
                state: item.properties.state,
                type: item.properties.type,
                website: item.properties.website,
                zip: item.properties.zip,

                syncStatus: 'synced',
                updatedAt: new Date(item.updatedAt).getTime()
            }));
        } catch (error) {
            console.error('API Fetch Error', error);
            throw error;
        }
    },

    createCompany: async (company: Omit<Company, 'id' | 'syncStatus' | 'updatedAt'>): Promise<Company> => {
        if (!getApiKey()) {
            await delay(500);
            return { ...company, id: Math.random().toString(36).substr(2, 9), syncStatus: 'synced', updatedAt: Date.now() };
        }
        const properties = {
            name: company.name,
            domain: company.domain,
            industry: company.industry,
            // Add other fields if needed for creation, keeping it simple for now
            phone: company.phone,
            city: company.city,
            website: company.website
        };
        const data = await hubspotRequest('/companies', 'POST', { properties });
        return { ...company, id: data.id, syncStatus: 'synced', updatedAt: Date.now() };
    },

    updateCompany: async (id: string, updates: Partial<Company>): Promise<Company> => {
        if (!getApiKey()) {
            await delay(500);
            return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Company;
        }
        const properties: any = {};
        if (updates.name) properties.name = updates.name;
        if (updates.domain) properties.domain = updates.domain;
        if (updates.industry) properties.industry = updates.industry;
        if (updates.phone) properties.phone = updates.phone;
        if (updates.city) properties.city = updates.city;
        if (updates.website) properties.website = updates.website;
        if (updates.description) properties.description = updates.description;

        await hubspotRequest(`/companies/${id}`, 'PATCH', { properties });
        return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Company;
    },

    // --- Deals ---
    fetchDeals: async (): Promise<Deal[]> => {
        if (!getApiKey()) {
            await delay(1000);
            return [
                { id: '201', name: 'Big Contract', amount: 50000, stage: 'negotiation', pipeline: 'default', companyId: '101', contactIds: ['1'], syncStatus: 'synced', updatedAt: Date.now() }
            ];
        }

        try {
            // Pre-fetch pipeline info
            await getPipelineInfo('dummy', 'dummy');

            const properties = [
                'dealname', 'amount', 'dealstage', 'pipeline',
                'closed_lost_reason', 'closed_lost_reason_dropdown', 'closed_won_reason',
                'closedate', 'createdate', 'dealtype', 'description',
                'hubspot_owner_assigneddate', 'hubspot_owner_id', 'hubspot_team_id'
            ].join(',');

            // We also want associations to get company name if possible, but standard API returns IDs.
            // For now we'll fetch properties.
            const results = await fetchAll(`/deals?properties=${properties}&associations=companies`);

            // Map results with correct stage and pipeline labels
            const mappedDeals = await Promise.all(results.map(async (item: any) => {
                const { pipelineLabel, stageLabel } = await getPipelineInfo(item.properties.pipeline, item.properties.dealstage);

                // Try to get company ID from associations
                const companyId = item.associations?.companies?.results?.[0]?.id;

                return {
                    id: item.id,
                    name: item.properties.dealname || '',
                    amount: Number(item.properties.amount) || 0,
                    stage: stageLabel,
                    pipeline: pipelineLabel,
                    companyId: companyId || '',
                    contactIds: [],

                    // Extended fields
                    closed_lost_reason: item.properties.closed_lost_reason,
                    closed_lost_reason_dropdown: item.properties.closed_lost_reason_dropdown,
                    closed_won_reason: item.properties.closed_won_reason,
                    closedate: item.properties.closedate,
                    createdate: item.properties.createdate,
                    dealtype: item.properties.dealtype,
                    description: item.properties.description,
                    hubspot_owner_assigneddate: item.properties.hubspot_owner_assigneddate,
                    hubspot_owner_id: item.properties.hubspot_owner_id,
                    hubspot_team_id: item.properties.hubspot_team_id,

                    syncStatus: 'synced',
                    updatedAt: new Date(item.updatedAt).getTime()
                };
            }));

            return mappedDeals as Deal[];
        } catch (error) {
            console.error('API Fetch Error', error);
            throw error;
        }
    },

    createDeal: async (deal: Omit<Deal, 'id' | 'syncStatus' | 'updatedAt'>): Promise<Deal> => {
        if (!getApiKey()) {
            await delay(500);
            return { ...deal, id: Math.random().toString(36).substr(2, 9), syncStatus: 'synced', updatedAt: Date.now() };
        }
        const properties = {
            dealname: deal.name,
            amount: deal.amount,
            dealstage: deal.stage,
            pipeline: deal.pipeline
        };
        const data = await hubspotRequest('/deals', 'POST', { properties });
        return { ...deal, id: data.id, syncStatus: 'synced', updatedAt: Date.now() };
    },

    updateDeal: async (id: string, updates: Partial<Deal>): Promise<Deal> => {
        if (!getApiKey()) {
            await delay(500);
            return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Deal;
        }
        const properties: any = {};
        if (updates.name) properties.dealname = updates.name;
        if (updates.amount) properties.amount = updates.amount;
        if (updates.stage) properties.dealstage = updates.stage;
        if (updates.pipeline) properties.pipeline = updates.pipeline;

        await hubspotRequest(`/deals/${id}`, 'PATCH', { properties });
        return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Deal;
    },

    // --- Tickets ---
    fetchTickets: async (): Promise<Ticket[]> => {
        if (!getApiKey()) {
            await delay(1000);
            return [
                { id: '301', subject: 'Login Issue', content: 'Cannot login', status: 'open', priority: 'high', contactId: '1', syncStatus: 'synced', updatedAt: Date.now() }
            ];
        }

        try {
            const results = await fetchAll('/tickets?properties=subject,content,hs_pipeline_stage,hs_ticket_priority');
            return results.map((item: any) => ({
                id: item.id,
                subject: item.properties.subject || '',
                content: item.properties.content || '',
                status: item.properties.hs_pipeline_stage || 'open',
                priority: item.properties.hs_ticket_priority || 'medium',
                contactId: '', // Requires associations
                syncStatus: 'synced',
                updatedAt: new Date(item.updatedAt).getTime()
            }));
        } catch (error) {
            console.error('API Fetch Error', error);
            throw error;
        }
    },

    createTicket: async (ticket: Omit<Ticket, 'id' | 'syncStatus' | 'updatedAt'>): Promise<Ticket> => {
        if (!getApiKey()) {
            await delay(500);
            return { ...ticket, id: Math.random().toString(36).substr(2, 9), syncStatus: 'synced', updatedAt: Date.now() };
        }
        const properties = {
            subject: ticket.subject,
            content: ticket.content,
            hs_pipeline_stage: ticket.status,
            hs_ticket_priority: ticket.priority
        };
        const data = await hubspotRequest('/tickets', 'POST', { properties });
        return { ...ticket, id: data.id, syncStatus: 'synced', updatedAt: Date.now() };
    },

    updateTicket: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
        if (!getApiKey()) {
            await delay(500);
            return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Ticket;
        }
        const properties: any = {};
        if (updates.subject) properties.subject = updates.subject;
        if (updates.content) properties.content = updates.content;
        if (updates.status) properties.hs_pipeline_stage = updates.status;
        if (updates.priority) properties.hs_ticket_priority = updates.priority;

        await hubspotRequest(`/tickets/${id}`, 'PATCH', { properties });
        return { id, ...updates, syncStatus: 'synced', updatedAt: Date.now() } as Ticket;
    },

    // --- Activities ---
    fetchActivities: async (): Promise<Activity[]> => {
        if (!getApiKey()) {
            await delay(1000);
            return generateMockActivities(5, '1', '101', '201', '301');
        }

        try {
            // Fetch different activity types in parallel, including associations
            const [notes, calls, emails, meetings] = await Promise.all([
                fetchAll('/notes?properties=hs_note_body,hs_timestamp&associations=contacts,companies,deals,tickets'),
                fetchAll('/calls?properties=hs_call_body,hs_timestamp,hs_call_title&associations=contacts,companies,deals,tickets'),
                fetchAll('/emails?properties=hs_email_html,hs_timestamp,hs_email_subject&associations=contacts,companies,deals,tickets'),
                fetchAll('/meetings?properties=hs_meeting_body,hs_timestamp,hs_meeting_title&associations=contacts,companies,deals,tickets')
            ]);

            const mapToActivity = (item: any, type: Activity['type'], contentField: string, titleField?: string): Activity => ({
                id: item.id,
                type,
                content: (titleField ? `${item.properties[titleField] || ''}\n` : '') + (item.properties[contentField] || ''),
                timestamp: new Date(item.properties.hs_timestamp || item.updatedAt).getTime(),
                // Map associations (taking the first one found for each type)
                contactId: item.associations?.contacts?.results?.[0]?.id,
                companyId: item.associations?.companies?.results?.[0]?.id,
                dealId: item.associations?.deals?.results?.[0]?.id,
                ticketId: item.associations?.tickets?.results?.[0]?.id,
                syncStatus: 'synced',
                updatedAt: new Date(item.updatedAt).getTime()
            });

            return [
                ...notes.map(i => mapToActivity(i, 'note', 'hs_note_body')),
                ...calls.map(i => mapToActivity(i, 'call', 'hs_call_body', 'hs_call_title')),
                ...emails.map(i => mapToActivity(i, 'email', 'hs_email_html', 'hs_email_subject')),
                ...meetings.map(i => mapToActivity(i, 'meeting', 'hs_meeting_body', 'hs_meeting_title'))
            ].sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

        } catch (error) {
            console.error('API Fetch Error', error);
            throw error;
        }
    },

    createActivity: async (activity: Omit<Activity, 'id' | 'syncStatus' | 'updatedAt'>): Promise<Activity> => {
        if (!getApiKey()) {
            await delay(500);
            return { ...activity, id: Math.random().toString(36).substr(2, 9), syncStatus: 'synced', updatedAt: Date.now() };
        }

        // 1. Upload Attachments if any
        const attachmentIds: string[] = [];
        if (activity.attachments && activity.attachments.length > 0) {
            for (const file of activity.attachments) {
                try {
                    // Convert base64 to Blob
                    const byteString = atob(file.data.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: file.type });

                    // Upload to HubSpot Files API
                    const formData = new FormData();
                    formData.append('file', blob, file.name);
                    formData.append('options', JSON.stringify({
                        access: 'PRIVATE',
                        ttl: 'P3M', // 3 Months
                        overwrite: false,
                        duplicateValidationStrategy: 'NONE',
                        duplicateValidationScope: 'ENTIRE_PORTAL'
                    }));
                    formData.append('folderPath', '/uploaded_from_pwa');

                    const token = getApiKey();
                    const uploadRes = await fetch(`${HUBSPOT_API_BASE.replace('/crm/v3/objects', '')}/files/v3/files`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        attachmentIds.push(uploadData.id);
                    } else {
                        console.error('File upload failed', await uploadRes.text());
                    }
                } catch (e) {
                    console.error('Error processing attachment', e);
                }
            }
        }

        let endpoint = '';
        let properties: any = {};

        switch (activity.type) {
            case 'note':
                endpoint = '/notes';
                properties = {
                    hs_note_body: activity.content,
                    hs_timestamp: activity.timestamp,
                    hs_attachment_ids: attachmentIds.join(';') // Link attachments
                };
                break;
            case 'call':
                endpoint = '/calls';
                properties = { hs_call_body: activity.content, hs_timestamp: activity.timestamp };
                break;
            case 'email':
                endpoint = '/emails';
                properties = { hs_email_text: activity.content, hs_timestamp: activity.timestamp };
                break;
            case 'meeting':
                endpoint = '/meetings';
                properties = { hs_meeting_body: activity.content, hs_timestamp: activity.timestamp };
                break;
        }

        const data = await hubspotRequest(endpoint, 'POST', { properties });

        // Helper to create association
        const associate = async (toObjectType: string, toObjectId: string, associationType: number) => {
            await hubspotRequest(
                `/${endpoint.substring(1)}/${data.id}/associations/${toObjectType}/${toObjectId}/${associationType}`,
                'PUT'
            );
        };

        // Create associations based on present IDs
        // Association Type IDs (Standard HubSpot)
        if (activity.contactId) {
            const types: Record<string, number> = { note: 202, call: 194, email: 198, meeting: 200 };
            if (types[activity.type]) await associate('contacts', activity.contactId, types[activity.type]);
        }
        if (activity.companyId) {
            const types: Record<string, number> = { note: 190, call: 182, email: 186, meeting: 188 };
            if (types[activity.type]) await associate('companies', activity.companyId, types[activity.type]);
        }
        if (activity.dealId) {
            const types: Record<string, number> = { note: 214, call: 206, email: 210, meeting: 212 };
            if (types[activity.type]) await associate('deals', activity.dealId, types[activity.type]);
        }
        if (activity.ticketId) {
            const types: Record<string, number> = { note: 228, call: 220, email: 224, meeting: 226 };
            if (types[activity.type]) await associate('tickets', activity.ticketId, types[activity.type]);
        }

        return { ...activity, id: data.id, syncStatus: 'synced', updatedAt: Date.now() };
    }
};
