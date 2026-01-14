import type { Section } from './types'

export const SERIES_A_CONFIG: Section[] = [
    {
        id: 'company_vision',
        title: 'Section 1: Company & Vision',
        questions: [
            { id: 'company_snapshot', label: 'Company Snapshot (ARR, Growth rate, Geography served)', type: 'textarea', required: true },
            { id: 'leadership_team', label: 'Leadership Team (Founders, CXO-level hires)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'growth_metrics',
        title: 'Section 2: Growth Metrics (Non-Negotiable)',
        questions: [
            { id: 'revenue_metrics', label: 'Revenue Metrics (ARR, Net revenue retention, Expansion revenue)', type: 'textarea', required: true },
            { id: 'customer_metrics', label: 'Customer Metrics (Enterprise vs SMB split, Churn, Cohort trends)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'gtm_scale',
        title: 'Section 3: GTM & Scale Readiness',
        questions: [
            { id: 'sales_motion', label: 'Sales Motion (Inbound/Outbound/PLG, Sales team structure)', type: 'textarea', required: true },
            { id: 'marketing_engine', label: 'Marketing Engine (Top 3 channels, ROI predictability)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'financials_advanced',
        title: 'Section 4: Financials',
        questions: [
            { id: 'unit_economics', label: 'Unit Economics (LTV/CAC, Payback period)', type: 'textarea', required: true },
            { id: 'burn_efficiency', label: 'Burn Efficiency (Burn multiple, Runway post-raise)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'competitive_moat',
        title: 'Section 5: Competitive Moat',
        questions: [
            { id: 'defensibility', label: 'Defensibility (Data moat, Network effects, Switching costs)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'fundraise_strategy',
        title: 'Section 6: Fundraise Strategy',
        questions: [
            { id: 'capital_ask', label: 'Capital Ask (Amount, Use of funds, Milestones)', type: 'textarea', required: true }
        ]
    },
    {
        id: 'governance_risk',
        title: 'Section 7: Governance & Risk',
        questions: [
            { id: 'board_reporting', label: 'Board & Reporting (Board structure, reporting cadence)', type: 'textarea', required: true },
            { id: 'risk_disclosure', label: 'Risk Disclosure (Regulatory, Market, Dependency risks)', type: 'textarea', required: true }
        ]
    }
]
