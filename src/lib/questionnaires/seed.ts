import type { Section } from './types'

export const SEED_CONFIG: Section[] = [
    {
        id: 'company_overview',
        title: 'Section 1: Company Overview',
        questions: [
            { id: 'startup_snapshot', label: 'Startup Snapshot (Name, website, Incorporation, Founding Date)', type: 'textarea', required: true },
            { id: 'team_structure', label: 'Team (Founders, key hires, reporting structure)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'traction_metrics',
        title: 'Section 2: Traction Metrics (Investor Core)',
        questions: [
            { id: 'revenue_metrics', label: 'Revenue (MRR / ARR, Growth rate MoM/QoQ)', type: 'textarea', required: true },
            { id: 'customer_metrics', label: 'Customers (Number, ACV/ARPU, Retention/Churn)', type: 'textarea', required: true },
            { id: 'usage_metrics', label: 'Usage Metrics (DAU/MAU or core engagement)', type: 'textarea' }
        ]
    },
    {
        id: 'pmf_signals',
        title: 'Section 3: Product & Market Fit Signals',
        questions: [
            { id: 'product_value', label: 'Product Value (Primary use case, most used features)', type: 'textarea', required: true },
            { id: 'customer_proof', label: 'Customer Proof (Testimonials, Case studies, Logos)', type: 'textarea' }
        ]
    },
    {
        id: 'gtm_engine',
        title: 'Section 4: Go-To-Market Engine',
        questions: [
            { id: 'customer_acquisition', label: 'Customer Acquisition (Channels, CAC, Sales cycle)', type: 'textarea', required: true },
            { id: 'gtm_scalability', label: 'Scalability of GTM (What is repeatable? What is founder-led?)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'market_competition',
        title: 'Section 5: Market & Competition',
        questions: [
            { id: 'market_size', label: 'Market Size (TAM / SAM / SOM - realistic)', type: 'textarea', required: true },
            { id: 'competitive_positioning', label: 'Competitive Positioning (Price, speed, value comparison)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'financial_discipline',
        title: 'Section 6: Financial Discipline',
        questions: [
            { id: 'burn_runway', label: 'Burn & Runway (Monthly burn, months remaining)', type: 'textarea', required: true },
            { id: 'unit_economics', label: 'Unit Economics (Gross margin, LTV vs CAC)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'fundraise_details',
        title: 'Section 7: Fundraise Details',
        questions: [
            { id: 'round_details', label: 'Round Details (Amount, Valuation/SAFE/Notes)', type: 'textarea', required: true },
            { id: 'use_of_funds', label: 'Use of funds (Detailed allocation)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'risks_governance',
        title: 'Section 8: Risks & Governance',
        questions: [
            { id: 'key_risks', label: 'Key Risks (Market, Team, Tech, Compliance)', type: 'textarea', required: true },
            { id: 'governance_ip', label: 'IP & Governance (Ownership, contracts, data compliance)', type: 'textarea', required: true }
        ]
    }
]
