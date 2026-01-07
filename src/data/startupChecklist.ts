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

export type StartupStage = 'Ideation' | 'Pre-seed' | 'MVP' | 'Seed' | 'Series A+'

export const STAGE_CHECKLISTS: Record<StartupStage, ChecklistCategory[]> = {
    'Ideation': [
        {
            title: "Core Pitch & Vision",
            items: [
                { id: 'pitch_deck', label: 'Pitch Deck (PDF)', isMandatory: true },
                { id: 'problem_solution', label: 'Problem–Solution Fit Explanation', isMandatory: true },
                { id: 'market_analysis', label: 'Market Opportunity Analysis (TAM–SAM–SOM)', isMandatory: true }
            ]
        },
        {
            title: "Founder & Team",
            items: [
                { id: 'founders_cv', label: 'Founders CVs / LinkedIn profiles', isMandatory: true },
                { id: 'time_commitment', label: 'Time commitment declaration', isMandatory: true }
            ]
        },
        {
            title: "Optional (Trust Builders)",
            items: [
                { id: 'customer_interviews', label: 'Customer interview notes' },
                { id: 'expert_validation', label: 'Industry expert validation' },
                { id: 'waitlist_signups', label: 'Early waitlist or signups' },
                { id: 'comp_landscape', label: 'Competitive Landscape Analysis' }
            ]
        }
    ],
    'Pre-seed': [
        {
            title: "Core Pitch & Vision",
            items: [
                { id: 'pitch_deck', label: 'Pitch Deck (PDF)', isMandatory: true },
                { id: 'startup_summary', label: 'One-page Startup Summary', isMandatory: true },
                { id: 'problem_solution', label: 'Problem–Solution Fit Explanation', isMandatory: true },
                { id: 'market_analysis', label: 'Market Opportunity Analysis (TAM–SAM–SOM)', isMandatory: true }
            ]
        },
        {
            title: "Founder & Team",
            items: [
                { id: 'founders_cv', label: 'Founders CVs / LinkedIn profiles', isMandatory: true },
                { id: 'roles_breakdown', label: 'Roles & responsibilities breakdown', isMandatory: true },
                { id: 'time_commitment', label: 'Time commitment declaration', isMandatory: true }
            ]
        },
        {
            title: "Early Traction",
            items: [
                { id: 'customer_interviews', label: 'Customer interview notes', isMandatory: true },
                { id: 'waitlist_signups', label: 'Early waitlist or signups' },
                { id: 'comp_landscape', label: 'Competitive Landscape Analysis', isMandatory: true }
            ]
        },
        {
            title: "Optional (If Incorporated)",
            items: [
                { id: 'incorp_cert', label: 'Certificate of Incorporation' },
                { id: 'founders_agreement', label: 'Founders agreement (equity split)' }
            ]
        }
    ],
    'MVP': [
        {
            title: "Core Pitch & Vision",
            items: [
                { id: 'pitch_deck', label: 'Pitch Deck (PDF)', isMandatory: true },
                { id: 'startup_summary', label: 'One-page Startup Summary', isMandatory: true },
                { id: 'vision_mission', label: 'Vision & Mission Statement', isMandatory: true }
            ]
        },
        {
            title: "Product & Traction",
            items: [
                { id: 'mvp_demo', label: 'MVP Demo (live link or video)', isMandatory: true },
                { id: 'product_roadmap', label: 'Product roadmap (6–12 months)', isMandatory: true },
                { id: 'user_feedback', label: 'User feedback / testimonials', isMandatory: true },
                { id: 'early_metrics', label: 'Early metrics (users, engagement)', isMandatory: true }
            ]
        },
        {
            title: "Business & Strategy",
            items: [
                { id: 'business_model', label: 'Business model document', isMandatory: true },
                { id: 'gtm_plan', label: 'Go-to-market plan', isMandatory: true },
                { id: 'pricing_strategy', label: 'Pricing strategy' },
                { id: 'unit_economics_basic', label: 'Unit economics (basic)' }
            ]
        },
        {
            title: "Founder & Team",
            items: [
                { id: 'founders_cv', label: 'Founders CVs / LinkedIn profiles', isMandatory: true },
                { id: 'roles_breakdown', label: 'Roles & responsibilities breakdown', isMandatory: true }
            ]
        },
        {
            title: "Legal & Ownership (Must be Incorporated)",
            items: [
                { id: 'incorp_cert', label: 'Certificate of Incorporation', isMandatory: true },
                { id: 'cin_proof', label: 'CIN / Registration Number', isMandatory: true },
                { id: 'pan_card', label: 'PAN of company', isMandatory: true },
                { id: 'moa_aoa', label: 'MoA & AoA', isMandatory: true },
                { id: 'cap_table', label: 'Cap Table', isMandatory: true },
                { id: 'founders_agreement_mvp', label: 'Founders agreement', isMandatory: true }
            ]
        },
        {
            title: "Technical",
            items: [
                { id: 'tech_arch', label: 'Tech architecture overview', isMandatory: true },
                { id: 'code_ownership', label: 'Code ownership declaration', isMandatory: true }
            ]
        }
    ],
    'Seed': [
        {
            title: "Core Pitch & Vision",
            items: [
                { id: 'pitch_deck', label: 'Pitch Deck (PDF)', isMandatory: true },
                { id: 'startup_summary', label: 'One-page Startup Summary', isMandatory: true }
            ]
        },
        {
            title: "Legal & Compliance (Must be Incorporated)",
            items: [
                { id: 'incorp_cert', label: 'Certificate of Incorporation', isMandatory: true },
                { id: 'cin_proof', label: 'CIN / Registration Number', isMandatory: true },
                { id: 'pan_card', label: 'PAN of company', isMandatory: true },
                { id: 'gst_reg', label: 'GST registration', isMandatory: true },
                { id: 'moa_aoa', label: 'MoA & AoA', isMandatory: true },
                { id: 'cap_table', label: 'Cap Table', isMandatory: true },
                { id: 'sha_agreement', label: 'Shareholders agreement', isMandatory: true }
            ]
        },
        {
            title: "Financials",
            items: [
                { id: 'p_l_statement', label: 'Profit & Loss statement', isMandatory: true },
                { id: 'cash_flow', label: 'Cash flow statement', isMandatory: true },
                { id: 'burn_rate', label: 'Burn rate & runway', isMandatory: true },
                { id: 'financial_projections', label: '12–18 month financial projections', isMandatory: true }
            ]
        },
        {
            title: "Customers & Revenue",
            items: [
                { id: 'customer_contracts', label: 'Customer contracts / LOIs', isMandatory: true },
                { id: 'invoices_proof', label: 'Invoices / payment proofs', isMandatory: true },
                { id: 'mrr_arr', label: 'MRR / ARR metrics', isMandatory: true },
                { id: 'retention_data', label: 'Retention & churn data' }
            ]
        },
        {
            title: "Product & Team",
            items: [
                { id: 'product_roadmap', label: 'Product roadmap', isMandatory: true },
                { id: 'employment_agreements', label: 'Employment agreements', isMandatory: true },
                { id: 'tech_arch', label: 'Tech architecture overview', isMandatory: true }
            ]
        },
        {
            title: "Governance",
            items: [
                { id: 'board_structure', label: 'Board structure', isMandatory: true },
                { id: 'reporting_cadence', label: 'Reporting cadence (monthly metrics)', isMandatory: true },
                { id: 'statutory_filings', label: 'Statutory filings' }
            ]
        }
    ],
    'Series A+': [
        {
            title: "Core Documents",
            items: [
                { id: 'pitch_deck', label: 'Pitch Deck (PDF)', isMandatory: true },
                { id: 'startup_summary', label: 'Executive Summary', isMandatory: true }
            ]
        },
        {
            title: "Legal & Compliance",
            items: [
                { id: 'incorp_cert', label: 'Certificate of Incorporation', isMandatory: true },
                { id: 'cin_proof', label: 'CIN / Registration Number', isMandatory: true },
                { id: 'pan_card', label: 'PAN of company', isMandatory: true },
                { id: 'gst_reg', label: 'GST registration', isMandatory: true },
                { id: 'moa_aoa', label: 'MoA & AoA', isMandatory: true },
                { id: 'cap_table', label: 'Cap Table', isMandatory: true },
                { id: 'sha_agreement', label: 'Shareholders agreement', isMandatory: true },
                { id: 'statutory_filings', label: 'Statutory filings', isMandatory: true }
            ]
        },
        {
            title: "Advanced Financials",
            items: [
                { id: 'audited_financials', label: 'Audited financial statements', isMandatory: true },
                { id: 'mis_reports', label: 'MIS reports', isMandatory: true },
                { id: 'dept_kpis', label: 'Department-wise KPIs', isMandatory: true },
                { id: 'burn_rate', label: 'Burn rate & runway', isMandatory: true }
            ]
        },
        {
            title: "Revenue & Customers",
            items: [
                { id: 'customer_contracts', label: 'Customer contracts', isMandatory: true },
                { id: 'mrr_arr', label: 'MRR / ARR metrics', isMandatory: true },
                { id: 'retention_data', label: 'Retention & churn data', isMandatory: true },
                { id: 'unit_economics', label: 'Unit economics', isMandatory: true }
            ]
        },
        {
            title: "Scale Readiness",
            items: [
                { id: 'expansion_plan', label: 'Market expansion plan', isMandatory: true },
                { id: 'hiring_plan', label: 'Hiring plan', isMandatory: true },
                { id: 'process_doc', label: 'Process documentation', isMandatory: true }
            ]
        },
        {
            title: "Risk & Compliance",
            items: [
                { id: 'data_protection', label: 'Data protection policy', isMandatory: true },
                { id: 'regulatory_risk', label: 'Regulatory risk assessment', isMandatory: true },
                { id: 'ip_filings', label: 'IP filings (trademark/patent)' },
                { id: 'litigation_disclosure', label: 'Litigation disclosure' }
            ]
        }
    ]
}

export const DATA_ROOM_STRUCTURE = [
    "01_Founders", "02_Pitch_Deck", "03_Product", "04_Market_Research",
    "05_Traction", "06_Financials", "07_Legal", "08_IP", "09_Governance", "10_Misc"
]
