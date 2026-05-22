import type { StartupProfileData } from '../hooks/useStartupProfile'

/**
 * Converts a StartupProfileData object into a structured text block
 * that can be injected into AI mentor system prompts so they already
 * know the user's startup without needing to be told.
 *
 * Returns an empty string if no meaningful data is available.
 */
export function buildStartupContextBlock(startup: Partial<StartupProfileData> | null | undefined): string {
    if (!startup) return '';

    const lines: string[] = [];

    if (startup.name)            lines.push(`Startup Name: ${startup.name}`);
    if (startup.founder_name)    lines.push(`Founder: ${startup.founder_name}`);
    if (startup.industry)        lines.push(`Industry: ${startup.industry}`);
    if (startup.stage)           lines.push(`Stage: ${startup.stage}`);
    if (startup.problem_solving) lines.push(`Problem They Solve: ${startup.problem_solving}`);
    if (startup.description)     lines.push(`Description: ${startup.description}`);
    if (startup.traction)        lines.push(`Traction / Team Size: ${startup.traction}`);
    if (startup.valuation)       lines.push(`Valuation / Funding Ask: ${startup.valuation}`);

    const location = [startup.city, startup.state].filter(Boolean).join(', ');
    if (location)                lines.push(`Location: ${location}`);

    if (startup.founder_bio)     lines.push(`Founder Background: ${startup.founder_bio}`);
    if (startup.ai_summary)      lines.push(`AI-Generated Summary: ${startup.ai_summary}`);

    // Flatten any questionnaire data if present
    if (startup.questionnaire) {
        const q = startup.questionnaire;
        const qLines: string[] = [];

        const get = (section: string, key: string) => q[section]?.[key];

        const solutionOverview   = get('core_problem_solution', 'solution_overview');
        const targetCustomer     = get('market_customers', 'target_customer');
        const marketSize         = get('market_customers', 'market_size');
        const whyNow             = get('market_customers', 'why_now');
        const tractionRevenue    = get('traction_gtm', 'traction_revenue');
        const gtmPlan            = get('traction_gtm', 'gtm_plan');
        const competitiveAdv     = get('competition_business', 'competitive_advantage');
        const businessModel      = get('competition_business', 'business_model');
        const fundingAsk         = get('funding_milestones', 'funding_amount');
        const milestones         = get('funding_milestones', 'milestones_12m');

        if (solutionOverview)  qLines.push(`Solution: ${solutionOverview}`);
        if (targetCustomer)    qLines.push(`Target Customer: ${targetCustomer}`);
        if (marketSize)        qLines.push(`Market Size: ${marketSize}`);
        if (whyNow)            qLines.push(`Why Now: ${whyNow}`);
        if (tractionRevenue)   qLines.push(`Traction/Revenue: ${tractionRevenue}`);
        if (gtmPlan)           qLines.push(`Go-To-Market: ${gtmPlan}`);
        if (competitiveAdv)    qLines.push(`Competitive Advantage: ${competitiveAdv}`);
        if (businessModel)     qLines.push(`Business Model: ${businessModel}`);
        if (fundingAsk)        qLines.push(`Funding Ask: ${fundingAsk}`);
        if (milestones)        qLines.push(`12-Month Milestones: ${milestones}`);

        lines.push(...qLines);
    }

    return lines.join('\n');
}
