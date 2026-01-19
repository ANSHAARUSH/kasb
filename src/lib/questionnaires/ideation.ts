import type { Section } from './types'

export const IDEATION_CONFIG: Section[] = [
    {
        id: 'founder_snapshot',
        title: 'Founder Snapshot',
        description: 'Trust Foundation',
        questions: [
            { id: 'founder_details', label: 'Founder Details (Names, Roles, Relations)', type: 'textarea', required: true, placeholder: 'Briefly list founders, roles, and relations...' },
            { id: 'linkedin_profile', label: 'LinkedIn Profile', type: 'text', required: true, placeholder: 'Link to primary founder LinkedIn profile (e.g., linkedin.com/in/username)...' },
            { id: 'founder_background', label: 'Founder Background & Domain Experience', type: 'textarea', required: true, placeholder: 'Professional summary and relevant problem/domain experience (max 150 words)...' },
            { id: 'commitment_status', label: 'Commitment Status', type: 'select', options: ['Full-time', 'Part-time'], required: true },
            { id: 'transition_timeline', label: 'Employment & Full-time Transition Timeline', type: 'textarea', placeholder: 'Current employment (if any) and planned transition plan...' }
        ]
    },
    {
        id: 'problem_clarity',
        title: 'Problem Clarity',
        description: 'Define the core issue (Critical)',
        questions: [
            { id: 'problem_statement', label: 'Problem Statement (max 150 words)', type: 'textarea', required: true, placeholder: 'What exactly is the problem? Who faces it? How often? Why is it painful?' },
            { id: 'current_alternatives', label: 'Current Alternatives', type: 'textarea', required: true, placeholder: 'How is this solved today? Why are existing solutions insufficient?' }
        ]
    },
    {
        id: 'product_thinking',
        title: 'Solution & Product Thinking',
        questions: [
            { id: 'solution_overview', label: 'Solution Overview & Unfair Advantage', type: 'textarea', required: true, placeholder: 'How does your product solve it? What is your core insight?' },
            { id: 'product_readiness', label: 'Product Readiness Stage', type: 'select', options: ['Idea only', 'Wireframes', 'Prototype', 'MVP'], required: true },
            { id: 'demo_link', label: 'Demo link or Upload description', type: 'text', placeholder: 'Provide a link to wireframes/demo if available' }
        ]
    },
    {
        id: 'market_understanding',
        title: 'Market Understanding',
        description: 'Reality Check',
        questions: [
            { id: 'target_customer', label: 'Target Customer (First Paying User)', type: 'text', required: true, placeholder: 'Who is your first paying user vs buyer?' },
            { id: 'market_entry', label: 'Initial Niche & Entry Strategy', type: 'textarea', required: true, placeholder: 'Beachhead market and why you chose it first...' }
        ]
    },
    {
        id: 'validation_signals',
        title: 'Validation Signals',
        description: 'Trust Booster',
        questions: [
            { id: 'customer_discovery', label: 'Customer Discovery (Conversations & Learnings)', type: 'textarea', required: true, placeholder: 'Number of conversations and key bullet point learnings...' },
            { id: 'early_signals', label: 'Early Signals (Waitlist, LOIs, Pilots)', type: 'textarea', placeholder: 'Describe any early interest or upload proof...' }
        ]
    },
    {
        id: 'business_model',
        title: 'Business Model Logic',
        questions: [
            { id: 'monetization', label: 'Monetization Hypothesis', type: 'textarea', required: true, placeholder: 'Who will pay? How will you make money? Rough pricing logic...' }
        ]
    },
    {
        id: 'execution_readiness',
        title: 'Execution Readiness',
        questions: [
            { id: 'funding_amount', label: 'Funding Requirement (Amount you are looking to raise)', type: 'text', required: true, placeholder: 'e.g., $500k, ₹50L, etc.' },
            { id: 'milestones_12m', label: 'Next 12 Months (Top 3 Milestones)', type: 'textarea', required: true },
            { id: 'fund_allocation', label: 'Fund Use (%) - Product, Hiring, Marketing', type: 'textarea', required: true, placeholder: 'e.g., Product: 50%, Hiring: 30%, Marketing: 20%' }
        ]
    },
    {
        id: 'legal_hygiene',
        title: 'Legal & Ownership Hygiene',
        questions: [
            { id: 'company_status', label: 'Company Status', type: 'select', options: ['Incorporated', 'Not incorporated'], required: true },
            { id: 'incorporation_date', label: 'Planned Incorporation Date', type: 'text' },
            { id: 'equity_split', label: 'Equity Split & ESOP Plan', type: 'text', required: true, placeholder: 'Founder split % and ESOP status' },
            { id: 'ip_declaration', label: 'IP Confirmation', type: 'select', options: ['Confirmed: IP belongs to founders/company', 'Pending'], required: true }
        ]
    },
    {
        id: 'integrity_check',
        title: 'Founder Integrity Check',
        description: 'Critical Assessment',
        questions: [
            { id: 'risks_assumptions', label: 'Key Risks & Assumptions', type: 'textarea', required: true, placeholder: 'What could go wrong? What are you most unsure about?' }
        ]
    },
    {
        id: 'final_confirmation',
        title: 'Final Confirmation',
        questions: [
            { id: 'founder_declaration', label: 'Declaration of Accuracy', type: 'select', options: ['Agree'], required: true },
            { id: 'declaration_signature', label: 'Startup Name, Founder Name & Date', type: 'text', required: true }
        ]
    }
]
