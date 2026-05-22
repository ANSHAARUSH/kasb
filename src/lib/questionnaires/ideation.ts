import type { Section } from './types'

export const STANDARD_QUESTIONNAIRE: Section[] = [
    {
        id: 'core_problem_solution',
        title: 'Core Problem & Solution',
        description: 'Define the foundation of your startup',
        questions: [
            { id: 'problem_statement', label: 'What problem are you solving?', type: 'textarea', required: true, placeholder: 'Describe the pain point...' },
            { id: 'solution_overview', label: 'Describe your solution/product.', type: 'textarea', required: true, placeholder: 'How does your product solve this?' }
        ]
    },
    {
        id: 'market_customers',
        title: 'Market & Customers',
        questions: [
            { id: 'target_customer', label: 'Who is your target market/customers?', type: 'textarea', required: true, placeholder: 'Define your ICP...' },
            { id: 'market_size', label: 'Market size/TAM?', type: 'text', required: true, placeholder: 'Total Addressable Market...' },
            { id: 'why_now', label: 'Why now?', type: 'textarea', required: false, placeholder: 'Market timing, trends...' }
        ]
    },
    {
        id: 'traction_gtm',
        title: 'Traction & Go-to-Market',
        questions: [
            { id: 'traction_revenue', label: 'What traction/users/revenue do you have?', type: 'textarea', required: false, placeholder: 'Current metrics... (Optional)' },
            { id: 'gtm_plan', label: 'Customer acquisition/go-to-market plan?', type: 'textarea', required: true, placeholder: 'How will you acquire users?' }
        ]
    },
    {
        id: 'competition_business',
        title: 'Competition & Business Model',
        questions: [
            { id: 'competitive_advantage', label: 'What is your competitive advantage?', type: 'textarea', required: true, placeholder: 'Your moat or differentiator...' },
            { id: 'business_model', label: 'How do you make money (business model)?', type: 'textarea', required: true, placeholder: 'Pricing and revenue streams...' }
        ]
    },
    {
        id: 'team',
        title: 'Founders & Team',
        questions: [
            { id: 'founder_details', label: 'Who are the founders?', type: 'textarea', required: true, placeholder: 'Names and brief backgrounds...' },
            { id: 'why_you', label: 'Why you?', type: 'textarea', required: false, placeholder: 'Unfair advantage of this team... (Optional)' }
        ]
    },
    {
        id: 'funding_milestones',
        title: 'Funding & Milestones',
        questions: [
            { id: 'funding_amount', label: 'Funding ask?', type: 'text', required: true, placeholder: 'Amount raising...' },
            { id: 'fund_allocation', label: 'Use of funds?', type: 'textarea', required: true, placeholder: 'E.g., 50% Engineering, 30% Marketing...' },
            { id: 'milestones_12m', label: 'Milestones?', type: 'textarea', required: true, placeholder: 'Next 12-18 month goals...' }
        ]
    }
]

export const IDEATION_CONFIG: Section[] = STANDARD_QUESTIONNAIRE
