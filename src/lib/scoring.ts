import type { Startup, Investor } from "../data/mockData"

export interface ImpactScoreResult {
    total: number
    breakdown: {
        signup: number
        profile: number
        completion: number
    }
}

export function calculateImpactScore(entity: Startup | Investor): ImpactScoreResult {
    let breakdown = {
        signup: 100, // Every account starts with 100
        profile: 0,
        completion: 0
    }

    // 1. Profile Completion (50 points)
    // For both: Name, Avatar, Bio, and at least some tags/expertise
    const isStartup = (e: any): e is Startup => 'problemSolving' in e;

    if (isStartup(entity)) {
        const hasBasicInfo = !!(entity.name?.trim() && entity.founder?.name?.trim() && entity.industry?.trim());
        const hasVisuals = !!(entity.logo?.trim() && !entity.logo.includes('placeholder') && entity.founder?.avatar?.trim());
        const hasBio = !!(entity.founder?.bio?.trim() && entity.founder.bio.length > 30);
        const hasTags = !!(entity.tags && entity.tags.length > 0);

        if (hasBasicInfo && hasVisuals && hasBio && hasTags) {
            breakdown.profile = 50;
        }

        // 2. Startup Completion (Dynamic Points based on answers)
        let answerCount = 0;
        if (entity.questionnaire) {
            Object.values(entity.questionnaire).forEach(section => {
                if (typeof section === 'object') {
                    answerCount += Object.keys(section).length;
                }
            });
        }

        // 2 points per answer, plus 20 bonus for AI summary finalization
        const isAIFinalized = entity.summaryStatus === 'final';
        breakdown.completion = (answerCount * 2) + (isAIFinalized ? 20 : 0);
    } else {
        // Investor Profile Completion (50 points)
        const hasBasicInfo = !!(entity.name?.trim() && entity.title?.trim());
        const hasVisuals = !!entity.avatar?.trim();
        const hasBio = !!(entity.bio?.trim() && entity.bio.length > 30);
        const hasExpertise = !!(entity.expertise && entity.expertise.length > 0);

        if (hasBasicInfo && hasVisuals && hasBio && hasExpertise) {
            breakdown.profile = 50;
        }

        // Investors don't have a "Completion" milestone in the same way yet, 
        // but we could add one later (e.g. for verified checks or deal history)
    }

    const boostPoints = isStartup(entity) ? (entity.communityBoosts || 0) : 0;

    return {
        total: breakdown.signup + breakdown.profile + breakdown.completion + boostPoints,
        breakdown
    }
}

