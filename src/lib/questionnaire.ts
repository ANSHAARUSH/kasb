export type QuestionType = 'text' | 'textarea' | 'number' | 'select'

export interface Question {
    id: string
    label: string
    type: QuestionType
    placeholder?: string
    options?: string[] // for select
    required?: boolean
    helperText?: string
}

export interface Section {
    id: string
    title: string
    description?: string
    questions: Question[]
}

export interface StageConfig {
    [stageId: string]: Section[]
}

export const QUESTIONNAIRE_CONFIG: StageConfig = {
    'Idea / Pre-Seed': [
        {
            id: 'basic_info',
            title: 'Basic Information',
            questions: [
                { id: 'location', label: 'Location', type: 'text', required: true, placeholder: 'City, Country' },
                { id: 'company_status', label: 'Company Status', type: 'select', options: ['Not Registered', 'Incorporated'], required: true }
            ]
        },
        {
            id: 'problem',
            title: 'The Problem',
            description: 'Define the core issue you are solving.',
            questions: [
                { id: 'customer_persona', label: 'Who exactly is the customer?', type: 'text', required: true },
                { id: 'pain_point', label: 'What problem do they face?', type: 'textarea', required: true },
                { id: 'current_solution', label: 'How are they solving it today?', type: 'textarea', required: true },
                { id: 'pain_severity', label: 'Why is this a serious pain point?', type: 'textarea', required: true }
            ]
        },
        {
            id: 'solution',
            title: 'Solution Idea',
            questions: [
                { id: 'proposed_solution', label: 'What is your proposed solution?', type: 'textarea', required: true },
                { id: 'how_it_works', label: 'How will it solve the problem?', type: 'textarea', required: true },
                { id: 'long_term_vision', label: 'What is your long-term product vision?', type: 'textarea', required: true }
            ]
        },
        {
            id: 'market',
            title: 'Market Understanding',
            questions: [
                { id: 'customer_type', label: 'Customer Type', type: 'select', options: ['B2B', 'B2C', 'B2B2C', 'D2C'], required: true },
                { id: 'target_geography', label: 'Target Geography', type: 'text', required: true },
                { id: 'tam', label: 'Estimated TAM', type: 'text', required: true, placeholder: 'e.g., $10B Global' },
                { id: 'why_now', label: 'Why is this market worth building in?', type: 'textarea', required: true }
            ]
        },
        {
            id: 'business_model',
            title: 'Business Model',
            questions: [
                { id: 'revenue_model', label: 'How do you plan to make money?', type: 'textarea', required: true },
                { id: 'payer', label: 'Who will pay?', type: 'text', required: true }
            ]
        },
        {
            id: 'founder_fit',
            title: 'Founder-Market Fit',
            questions: [
                { id: 'why_you', label: 'Why are you the right person to solve this?', type: 'textarea', required: true }
            ]
        },
        {
            id: 'vision_5yr',
            title: '5-Year Vision',
            questions: [
                { id: 'vision_statement', label: 'Where do you want this company to be in 5 years?', type: 'textarea', required: true }
            ]
        }
    ],
    'MVP / Seed': [
        // Inherits logic handled in component usually, but defining full set for simplicity or composite
        {
            id: 'product',
            title: 'Product',
            questions: [
                { id: 'product_description', label: 'Product Description (max 150 words)', type: 'textarea', required: true },
                { id: 'key_features', label: 'Key Features', type: 'textarea', required: true },
                { id: 'product_stage', label: 'Product Stage', type: 'select', options: ['Prototype', 'MVP', 'Live Beta', 'Live Production'], required: true },
                { id: 'demo_link', label: 'Demo Link', type: 'text', placeholder: 'https://...' }
            ]
        },
        {
            id: 'traction',
            title: 'Traction',
            questions: [
                { id: 'current_users', label: 'Current Users/Customers', type: 'text', required: true },
                { id: 'growth_rate', label: 'Monthly Growth Rate', type: 'text', required: true },
                { id: 'early_revenue', label: 'Early Revenue (if any)', type: 'text', placeholder: '$0 MRR' },
                { id: 'pilots', label: 'Pilots or Partnerships', type: 'textarea' }
            ]
        },
        {
            id: 'competition',
            title: 'Competition',
            questions: [
                { id: 'top_competitors', label: 'Top Competitors', type: 'textarea', required: true },
                { id: 'differentiation', label: 'Key Differentiation', type: 'textarea', required: true }
            ]
        },
        {
            id: 'gtm',
            title: 'Go-To-Market',
            questions: [
                { id: 'channels', label: 'Customer Acquisition Channels', type: 'textarea', required: true },
                { id: 'marketing_experiments', label: 'Early Marketing Experiments', type: 'textarea', required: true }
            ]
        },
        {
            id: 'fundraising',
            title: 'Fundraising',
            questions: [
                { id: 'amount_raising', label: 'Amount Raising', type: 'text', required: true },
                { id: 'use_of_funds', label: 'Use of Funds', type: 'textarea', required: true }
            ]
        }
    ],
    'Early Growth / Series A': [
        {
            id: 'metrics',
            title: 'Traction & Metrics',
            questions: [
                { id: 'mrr', label: 'Monthly Revenue', type: 'text', required: true },
                { id: 'mom_growth', label: 'MoM Growth', type: 'text', required: true },
                { id: 'retention', label: 'Retention Rate', type: 'text', required: true },
                { id: 'cac', label: 'CAC', type: 'text', required: true },
                { id: 'ltv', label: 'LTV', type: 'text' }
            ]
        },
        {
            id: 'business_details',
            title: 'Business Model Depth',
            questions: [
                { id: 'pricing_model', label: 'Pricing Model', type: 'textarea', required: true },
                { id: 'gross_margins', label: 'Gross Margins', type: 'text', required: true }
            ]
        },
        {
            id: 'financials',
            title: 'Financial Snapshot',
            questions: [
                { id: 'burn', label: 'Monthly Burn', type: 'text', required: true },
                { id: 'runway', label: 'Runway', type: 'text', required: true },
                { id: 'key_expenses', label: 'Key Expenses', type: 'textarea', required: true }
            ]
        },
        {
            id: 'team',
            title: 'Team Expansion',
            questions: [
                { id: 'key_hires', label: 'Key Hires Done', type: 'textarea', required: true },
                { id: 'hiring_plan', label: 'Hiring Plan', type: 'textarea', required: true }
            ]
        },
        {
            id: 'strategy',
            title: 'Strategy',
            questions: [
                { id: 'growth_plan', label: 'Growth Plan (12-24 months)', type: 'textarea', required: true },
                { id: 'market_expansion', label: 'Market Expansion Strategy', type: 'textarea', required: true }
            ]
        },
        {
            id: 'fundraising_detailed',
            title: 'Fundraising',
            questions: [
                { id: 'amount_raising', label: 'Amount Raising', type: 'text', required: true },
                { id: 'valuation', label: 'Valuation Expectation', type: 'text', required: true },
                { id: 'previous_funding', label: 'Previous Funding', type: 'textarea', required: true }
            ]
        }
    ]
}

// Fallback for stages not explicitly matched
export const DEFAULT_STAGE_CONFIG = QUESTIONNAIRE_CONFIG['Idea / Pre-Seed']
