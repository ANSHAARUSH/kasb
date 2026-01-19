import type { Section } from './types'

export const MVP_PRESEED_CONFIG: Section[] = [
    {
        id: 'team_snapshot',
        title: 'Section 1: Founder & Team Snapshot',
        questions: [
            { id: 'founder_details', label: 'Founder Details (Names, roles, LinkedIn)', type: 'textarea', required: true },
            { id: 'equity_ownership', label: 'Equity ownership %', type: 'text', required: true },
            { id: 'team_composition', label: 'Team Composition (Core members, key skills)', type: 'textarea' },
            { id: 'team_gaps', label: 'Current Gaps', type: 'textarea' },
            { id: 'commitment_status', label: 'Commitment Status', type: 'select', options: ['All founders full-time', 'Transition timeline in place', 'Part-time'], required: true }
        ]
    },
    {
        id: 'problem_solution',
        title: 'Section 2: Problem–Solution Validation',
        questions: [
            { id: 'problem_recap', label: 'Problem Recap (What, Who, Why now?)', type: 'textarea', required: true },
            { id: 'solution_description', label: 'Solution (Product today, workflows, why you?)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'mvp_readiness',
        title: 'Section 3: Product & MVP Readiness',
        questions: [
            { id: 'product_status', label: 'Product Status', type: 'select', options: ['MVP live', 'Private beta', 'Public beta', 'Alpha/Build phase'], required: true },
            { id: 'product_evidence', label: 'Product Evidence (Live URL / Demo video)', type: 'text' },
            { id: 'screenshots_walkthrough', label: 'Screenshots or walkthrough', type: 'textarea' },
            { id: 'key_learnings', label: 'Key Learnings (Feedback, invalidated assumptions)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'validation_signals',
        title: 'Section 4: Early Validation Signals',
        questions: [
            { id: 'user_adoption', label: 'User Adoption (Total, Active, Retention)', type: 'textarea', required: true },
            { id: 'customer_feedback', label: 'Customer Feedback (Top 3 signals & objections)', type: 'textarea' }
        ]
    },
    {
        id: 'market_gtm',
        title: 'Section 5: Market Understanding',
        questions: [
            { id: 'target_market', label: 'Target Market (ICP, Buyer vs User)', type: 'textarea', required: true },
            { id: 'gtm_early', label: 'Go-To-Market (What worked/didn\'t work)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'business_model',
        title: 'Section 6: Business Model Thinking',
        questions: [
            { id: 'monetization_status', label: 'Monetization Status', type: 'select', options: ['Free only', 'Testing pricing', 'Early paid users', 'Pre-revenue'], required: true },
            { id: 'pricing_logic', label: 'Pricing Logic (Current/Planned, Rationale)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'competition_diff',
        title: 'Section 7: Competition & Differentiation',
        questions: [
            { id: 'competitive_landscape', label: 'Competitive Landscape (Top 5, Direct/Indirect)', type: 'textarea', required: true },
            { id: 'differentiation', label: 'Differentiation (Why you win, switching costs)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'execution_capital',
        title: 'Section 8: Execution & Capital Plan',
        questions: [
            { id: 'funding_amount', label: 'Funding Requirement (Amount you are looking to raise)', type: 'text', required: true, placeholder: 'e.g., $500k, ₹50L, etc.' },
            { id: 'yearly_goals', label: 'Next 12 Months Goals (Product, Users, Revenue)', type: 'textarea', required: true },
            { id: 'use_of_funds', label: 'Use of Funds (Product, Hiring, GTM, Ops %)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'legal_integrity',
        title: 'Section 9: Legal & Integrity',
        questions: [
            { id: 'company_status', label: 'Company Status (Incorporation, Cap table)', type: 'textarea', required: true },
            { id: 'key_risks', label: 'Key Risks (Execution, Market)', type: 'textarea', required: true }
        ]
    }
]
