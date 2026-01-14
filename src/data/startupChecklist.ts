export interface ChecklistItem {
    id: string
    label: string
    description?: string
    isMandatory?: boolean
}

export interface ChecklistCategory {
    title: string
    items: ChecklistItem[]
}

export type StartupStage = 'Idea' | 'MVP' | 'Seed' | 'Growth'

/**
 * Normalizes any string stage name (including legacy names) to one of the 4 canonical stages.
 */
export function normalizeStage(stage?: string): StartupStage {
    if (!stage) return 'Idea';

    const s = stage.toLowerCase().trim();

    if (s.includes('ideation') || s.includes('pre-seed') || s.includes('idea')) return 'Idea';
    if (s.includes('mvp') || s.includes('prototype')) return 'MVP';
    if (s.includes('seed')) return 'Seed';
    if (s.includes('growth') || s.includes('series') || s.includes('scaled')) return 'Growth';

    return 'Idea'; // Default fallback
}

export interface DocumentChecklist {
    id: string
    label: string
    category: string
    isMandatory: boolean
    description?: string
}

export const UNIVERSAL_DOCUMENTS: DocumentChecklist[] = [
    { id: 'pitch_deck', label: 'Pitch Deck', category: '02_Pitch_Deck', isMandatory: true },
    { id: 'startup_summary', label: 'One-page Startup Summary', category: '02_Pitch_Deck', isMandatory: true },
    { id: 'vision_mission', label: 'Vision & Mission Statement', category: '02_Pitch_Deck', isMandatory: true },
    { id: 'problem_solution', label: 'Problem–Solution Fit Explanation', category: '02_Pitch_Deck', isMandatory: true },
    { id: 'founders_cv', label: 'Founders CVs / LinkedIn profiles', category: '01_Founders', isMandatory: true },
    { id: 'roles_breakdown', label: 'Roles & responsibilities breakdown', category: '01_Founders', isMandatory: true },
    { id: 'time_commitment', label: 'Time commitment declaration', category: '01_Founders', isMandatory: true },
    { id: 'incorp_cert', label: 'Certificate of Incorporation', category: '07_Legal', isMandatory: false }, // Mandatory if incorporated
    { id: 'cin_proof', label: 'CIN (India)', category: '07_Legal', isMandatory: false },
    { id: 'pan_card', label: 'Company PAN', category: '07_Legal', isMandatory: false },
    { id: 'office_address', label: 'Registered office address proof', category: '07_Legal', isMandatory: false }
]

export const STAGE_SPECIFIC_LOGIC: Record<StartupStage, { mandatory: DocumentChecklist[], optional: DocumentChecklist[] }> = {
    'Idea': {
        mandatory: [
            { id: 'idea_note', label: 'Concept / Idea Note', category: '02_Pitch_Deck', isMandatory: true },
            { id: 'market_analysis', label: 'Market Opportunity Analysis (TAM–SAM–SOM)', category: '04_Market_Research', isMandatory: true },
            { id: 'comp_landscape', label: 'Competitive Landscape Analysis', category: '04_Market_Research', isMandatory: true },
            { id: 'revenue_logic', label: 'Basic Revenue Logic', category: '06_Financials', isMandatory: true }
        ],
        optional: [
            { id: 'customer_interviews', label: 'Customer interview notes', category: '05_Traction', isMandatory: false },
            { id: 'expert_validation', label: 'Industry expert validation', category: '03_Product', isMandatory: false },
            { id: 'waitlist_signups', label: 'Early waitlist or signups', category: '05_Traction', isMandatory: false },
            { id: 'founders_agreement', label: 'Founder agreement (equity clarity)', category: '07_Legal', isMandatory: false }
        ]
    },
    'MVP': {
        mandatory: [
            { id: 'mvp_demo', label: 'MVP Demo (live link or video)', category: '03_Product', isMandatory: true },
            { id: 'product_roadmap', label: 'Product roadmap (6–12 months)', category: '03_Product', isMandatory: true },
            { id: 'user_feedback', label: 'User feedback / testimonials', category: '05_Traction', isMandatory: true },
            { id: 'usage_metrics', label: 'Early usage metrics', category: '05_Traction', isMandatory: true },
            { id: 'business_model', label: 'Business model document', category: '03_Product', isMandatory: true },
            { id: 'pricing_strategy', label: 'Pricing strategy', category: '03_Product', isMandatory: true },
            { id: 'gtm_plan', label: 'Go-to-market plan', category: '04_Market_Research', isMandatory: true },
            { id: 'unit_economics', label: 'Basic unit economics', category: '06_Financials', isMandatory: true },
            { id: 'moa_aoa', label: 'MoA & AoA', category: '07_Legal', isMandatory: true },
            { id: 'cap_table', label: 'Cap Table', category: '07_Legal', isMandatory: true },
            { id: 'founders_agreement_mvp', label: 'Founders agreement', category: '07_Legal', isMandatory: true },
            { id: 'tech_arch', label: 'Tech architecture overview', category: '10_Misc', isMandatory: true },
            { id: 'code_ownership', label: 'Code ownership declaration', category: '10_Misc', isMandatory: true }
        ],
        optional: [
            { id: 'esop_plan', label: 'ESOP plan', category: '07_Legal', isMandatory: false },
            { id: 'dep_list', label: 'Third-party dependency list', category: '10_Misc', isMandatory: false }
        ]
    },
    'Seed': {
        mandatory: [
            { id: 'p_l_statement', label: 'Profit & Loss statement', category: '06_Financials', isMandatory: true },
            { id: 'cash_flow', label: 'Cash flow statement', category: '06_Financials', isMandatory: true },
            { id: 'burn_rate', label: 'Burn rate & runway', category: '06_Financials', isMandatory: true },
            { id: 'financial_projections', label: '12–18 month financial projections', category: '06_Financials', isMandatory: true },
            { id: 'customer_contracts', label: 'Customer contracts / LOIs', category: '05_Traction', isMandatory: true },
            { id: 'payment_proofs', label: 'Invoices or payment proofs', category: '05_Traction', isMandatory: true },
            { id: 'revenue_metrics', label: 'MRR / ARR metrics', category: '05_Traction', isMandatory: true },
            { id: 'retention_data', label: 'Retention & churn data', category: '05_Traction', isMandatory: true },
            { id: 'gst_reg', label: 'GST registration', category: '07_Legal', isMandatory: true },
            { id: 'statutory_filings', label: 'Statutory filings', category: '07_Legal', isMandatory: true },
            { id: 'employment_agreements', label: 'Employment agreements', category: '07_Legal', isMandatory: true },
            { id: 'sha_agreement', label: 'Shareholders agreement', category: '09_Governance', isMandatory: true },
            { id: 'board_structure', label: 'Board structure', category: '09_Governance', isMandatory: true },
            { id: 'reporting_cadence', label: 'Monthly reporting cadence', category: '09_Governance', isMandatory: true }
        ],
        optional: [
            { id: 'ip_filings', label: 'IP filings', category: '08_IP', isMandatory: false }
        ]
    },
    'Growth': {
        mandatory: [
            { id: 'audited_financials', label: 'Audited financial statements', category: '06_Financials', isMandatory: true },
            { id: 'mis_reports', label: 'MIS reports', category: '06_Financials', isMandatory: true },
            { id: 'dept_kpis', label: 'Department-wise KPIs', category: '05_Traction', isMandatory: true },
            { id: 'expansion_plan', label: 'Market expansion plan', category: '03_Product', isMandatory: true },
            { id: 'hiring_plan', label: 'Hiring plan', category: '01_Founders', isMandatory: true },
            { id: 'process_doc', label: 'Process documentation', category: '10_Misc', isMandatory: true },
            { id: 'data_protection', label: 'Data protection policy', category: '07_Legal', isMandatory: true },
            { id: 'risk_assessment', label: 'Regulatory risk assessment', category: '07_Legal', isMandatory: true }
        ],
        optional: [
            { id: 'litigation_discl', label: 'Litigation disclosures', category: '07_Legal', isMandatory: false }
        ]
    }
}

export const DATA_ROOM_STRUCTURE = [
    "01_Founders", "02_Pitch_Deck", "03_Product", "04_Market_Research",
    "05_Traction", "06_Financials", "07_Legal", "08_IP", "09_Governance", "10_Misc"
]
