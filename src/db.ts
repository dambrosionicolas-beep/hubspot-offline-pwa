import Dexie, { type EntityTable } from 'dexie';

interface BaseEntity {
    id: string;
    syncStatus: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
    updatedAt: number;
}

interface Contact extends BaseEntity {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyId?: string; // Link to Company

    // Extended fields
    address?: string;
    city?: string;
    company?: string;
    country?: string;
    createdate?: string;
    cv?: string;
    dans_quelle_fourchette_se_situe_votre_budget__?: string;
    fax?: string;
    gender?: string;
    grader_consent_to_communicate?: string;
    hubspot_owner_assigneddate?: string;
    hubspot_owner_id?: string;
    hubspot_team_id?: string;
    hubspotscore?: string;
    industry?: string;
    job_function?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    linkedin?: string;
    message?: string;
    mobilephone?: string;
    nombre_de_flux_souhaites?: string;
    notes_last_contacted?: string;
    notes_last_updated?: string;
    notes_next_activity_date?: string;
    num_associated_deals?: string;
    num_contacted_notes?: string;
    num_notes?: string;
    number_of_associated_companies?: string;
    numemployees?: string;
    recent_deal_amount?: string;
    recent_deal_close_date?: string;
    salutation?: string;
    state?: string;
    statut_du_recrutement?: string;
    total_revenue?: string;
    type_de_demo?: string;
    type_de_formation?: string;
    url_du_dernier_devis_publie?: string;
    website?: string;
    work_email?: string;
}

interface Company extends BaseEntity {
    name: string;
    domain: string;
    industry?: string;

    // Extended fields
    address?: string;
    address2?: string;
    annualrevenue?: string;
    city?: string;
    closedate?: string;
    country?: string;
    createdate?: string;
    description?: string;
    founded_year?: string;
    lifecyclestage?: string;
    numberofemployees?: string;
    numero_de_siret?: string;
    phone?: string;
    recent_deal_amount?: string;
    recent_deal_close_date?: string;
    sales_owner_hubspot?: string;
    state?: string;
    type?: string;
    website?: string;
    zip?: string;
}

interface Deal extends BaseEntity {
    name: string;
    amount: number;
    stage: string;
    pipeline: string;
    companyId?: string;
    contactIds: string[]; // Many-to-many usually, but array of IDs works for simple cases

    // Extended fields
    closed_lost_reason?: string;
    closed_lost_reason_dropdown?: string;
    closed_won_reason?: string;
    closedate?: string;
    company_name?: string; // Denormalized for display
    createdate?: string;
    dealtype?: string;
    description?: string;
    hubspot_owner_assigneddate?: string;
    hubspot_owner_id?: string;
    hubspot_team_id?: string;
}

interface Ticket extends BaseEntity {
    subject: string;
    content: string;
    status: string;
    priority: string;
    contactId?: string;
    companyId?: string;
}

interface Activity extends BaseEntity {
    type: 'note' | 'call' | 'email' | 'meeting';
    content: string; // The note body, email body, etc.
    timestamp: number; // When the activity happened

    // Associations
    contactId?: string;
    companyId?: string;
    dealId?: string;
    ticketId?: string;
    attachments?: {
        name: string;
        type: string;
        data: string; // Base64
    }[];
}

interface SyncQueueItem {
    id?: number;
    type: 'create' | 'update' | 'delete';
    entity: 'contact' | 'company' | 'deal' | 'ticket' | 'activity';
    data: any;
    timestamp: number;
    status?: 'pending' | 'processing' | 'failed';
    error?: string;
}

const db = new Dexie('HubSpotOfflineDB') as Dexie & {
    contacts: EntityTable<Contact, 'id'>;
    companies: EntityTable<Company, 'id'>;
    deals: EntityTable<Deal, 'id'>;
    tickets: EntityTable<Ticket, 'id'>;
    activities: EntityTable<Activity, 'id'>;
    syncQueue: EntityTable<SyncQueueItem, 'id'>;
};

// Schema definition
db.version(2).stores({
    contacts: 'id, firstName, lastName, email, companyId, syncStatus, updatedAt',
    companies: 'id, name, domain, syncStatus, updatedAt',
    deals: 'id, name, stage, pipeline, companyId, syncStatus, updatedAt',
    tickets: 'id, subject, status, contactId, companyId, syncStatus, updatedAt',
    activities: 'id, type, timestamp, contactId, companyId, dealId, ticketId, syncStatus, updatedAt',
    syncQueue: '++id, type, entity, timestamp'
});

export type { Contact, Company, Deal, Ticket, Activity, SyncQueueItem };
export { db };
