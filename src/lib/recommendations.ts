import { runInference } from "./ai";
import type { Startup, Investor } from "../data/mockData";

export interface MatchRecommendation {
    id: string;
    matchScore: number; // 0-100
    matchLevel: 'high' | 'medium' | 'low';
    explanation: string;
    keyHighlights: string[];
    entity: Startup | Investor;
}

export interface RecommendationResult {
    recommendations: MatchRecommendation[];
    generatedAt: string;
}

/**
 * Simple cache for recommendations
 */
const recommendationCache = new Map<string, { data: RecommendationResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Maps technical AI errors to user-friendly professional messages
 */
export function getFriendlyErrorMessage(error: any): string {
    const message = error?.message || String(error);

    if (message.includes('rate limit') || message.includes('429')) {
        return "Our AI analyst is currently handling a high volume of requests. Please wait a moment while we process your personalized insights.";
    }

    if (message.includes('API key') || message.includes('auth') || message.includes('401')) {
        return "Personalized matching is momentarily unavailable. Our team has been notified, and you can still explore the full startup directory below.";
    }

    if (message.includes('timeout') || message.includes('Network')) {
        return "We're having trouble reaching our AI engine. Please check your connection or try again in a few seconds.";
    }

    if (message.includes('context_length') || message.includes('too long')) {
        return "This profile contains extensive data that our AI is currently processig. Try simplifying your thesis for faster results.";
    }

    return "We're refining your personalized matches. If this persists, please try exploring the discovery feed below.";
}

/**
 * Clean JSON string from AI response (removes markdown code blocks if present)
 */
function cleanJsonString(str: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        return jsonMatch[1].trim();
    }
    return str.trim();
}

/**
 * Ensures match score is a 0-100 integer
 */
function sanitizeScore(score: any): number {
    let s = parseFloat(score);
    if (isNaN(s)) return 0;

    // If AI returns 0.87 instead of 87
    if (s > 0 && s <= 1) {
        s = s * 100;
    }

    return Math.round(Math.min(100, Math.max(0, s)));
}

function getCacheKey(userId: string, type: 'investor' | 'startup'): string {
    return `${type}_${userId}`;
}

function getCachedRecommendations(userId: string, type: 'investor' | 'startup'): RecommendationResult | null {
    const key = getCacheKey(userId, type);
    const cached = recommendationCache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
        recommendationCache.delete(key);
        return null;
    }

    return cached.data;
}

function setCachedRecommendations(userId: string, type: 'investor' | 'startup', data: RecommendationResult): void {
    const key = getCacheKey(userId, type);
    recommendationCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Generate AI-powered investor recommendations for a startup
 */
export async function generateInvestorRecommendations(
    startup: Startup,
    investors: Investor[],
    apiKey: string
): Promise<RecommendationResult> {
    // Check cache first
    const cached = getCachedRecommendations(startup.id, 'investor');
    if (cached) {
        console.log('Returning cached investor recommendations');
        return cached;
    }

    if (!apiKey) {
        throw new Error('AI API key is invalid or missing. Please check your configuration.');
    }

    const prompt = `You are an expert venture capital analyst. Analyze this startup and recommend the best-matching investors.

**Startup Profile:**
- Name: ${startup.name}
- Industry: ${startup.industry}
- Stage: ${startup.metrics.stage}
- Description: ${startup.description || 'N/A'}
- Problem Solving: ${startup.problemSolving || 'N/A'}
- Valuation: ${startup.metrics.valuation || 'N/A'}
- Traction: ${startup.metrics.traction || 'N/A'}

**Available Investors:**
${investors.map((inv, i) => `
${i + 1}. ${inv.name} (ID: ${inv.id})
   - Expertise: ${inv.expertise?.join(', ') || 'N/A'}
   - Bio: ${inv.bio || 'N/A'}
   - Funds Available: ${inv.fundsAvailable || 'N/A'}
`).join('\n')}

Return a JSON object with this exact structure:
{
  "matches": [
    {
      "investorId": "investor-uuid",
      "matchScore": 85,
      "matchLevel": "high",
      "explanation": "Brief 1-2 sentence explanation of why this is a good match",
      "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
    }
  ]
}

Rank by match score (highest first). Include all investors.`;

    try {
        const content = await runInference(apiKey, prompt);

        const cleanedContent = cleanJsonString(content);
        console.log('AI Investor Recommendation Response:', cleanedContent);
        const parsed = JSON.parse(cleanedContent);

        const recommendations: MatchRecommendation[] = parsed.matches.map((match: any) => {
            const matchId = String(match.investorId).toLowerCase();
            const investor = investors.find(i => i.id.toLowerCase() === matchId);

            if (!investor) {
                console.warn(`Investor ${match.investorId} not found in list`);
                return null;
            }

            const score = sanitizeScore(match.matchScore);
            let level: 'high' | 'medium' | 'low' = 'low';
            if (score >= 70) level = 'high';
            else if (score >= 40) level = 'medium';

            return {
                id: investor.id,
                matchScore: score,
                matchLevel: level,
                explanation: match.explanation || 'Good potential match',
                keyHighlights: match.keyHighlights || [],
                entity: investor
            };
        }).filter(Boolean) as MatchRecommendation[];

        const result: RecommendationResult = {
            recommendations,
            generatedAt: new Date().toISOString()
        };

        // Cache the result
        setCachedRecommendations(startup.id, 'investor', result);

        return result;
    } catch (error) {
        console.error('AI recommendation error:', error);
        throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Generate AI-powered startup recommendations for an investor
 */
export async function generateStartupRecommendations(
    investor: Investor,
    startups: Startup[],
    apiKey: string,
    recentViews: Startup[] = []
): Promise<RecommendationResult> {
    // Check cache first
    const cached = getCachedRecommendations(investor.id, 'startup');
    if (cached) {
        console.log('Returning cached startup recommendations');
        return cached;
    }

    if (!apiKey) {
        throw new Error('AI API key is invalid or missing. Please check your configuration.');
    }

    const prompt = `You are an expert venture capital analyst. Analyze this investor's profile and recommend the best-matching startups.

**Investor Profile:**
- Name: ${investor.name}
- Expertise: ${investor.expertise?.join(', ') || 'N/A'}
- Bio: ${investor.bio || 'N/A'}
- Funds Available: ${investor.fundsAvailable || 'N/A'}
- Portfolio Size: ${investor.investments || 0} investments

**Recently Viewed by this Investor (Context):**
${recentViews.length > 0
            ? recentViews.map(s => `- ${s.name} (${s.industry})`).join('\n')
            : 'None'}

**Available Startups:**
${startups.map((startup, i) => `
${i + 1}. ${startup.name} (ID: ${startup.id})
   - Industry: ${startup.industry}
   - Stage: ${startup.metrics.stage}
   - Description: ${startup.description || 'N/A'}
   - Problem: ${startup.problemSolving || 'N/A'}
   - Valuation: ${startup.metrics.valuation || 'N/A'}
   - Traction: ${startup.metrics.traction || 'N/A'}
`).join('\n')}

Return a JSON object with this exact structure:
{
  "matches": [
    {
      "startupId": "startup-uuid",
      "matchScore": 85,
      "matchLevel": "high",
      "explanation": "Brief 1-2 sentence explanation of why this is a good match",
      "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
    }
  ]
}

Rank by match score (highest first). Include all startups.`;

    try {
        const content = await runInference(apiKey, prompt);

        const cleanedContent = cleanJsonString(content);
        console.log('AI Startup Recommendation Response:', cleanedContent);
        const parsed = JSON.parse(cleanedContent);

        const recommendations: MatchRecommendation[] = parsed.matches.map((match: any) => {
            const matchId = String(match.startupId).toLowerCase();
            const startup = startups.find(s => s.id.toLowerCase() === matchId);

            if (!startup) {
                console.warn(`Startup ${match.startupId} not found in list`);
                return null;
            }

            const score = sanitizeScore(match.matchScore);
            let level: 'high' | 'medium' | 'low' = 'low';
            if (score >= 70) level = 'high';
            else if (score >= 40) level = 'medium';

            return {
                id: startup.id,
                matchScore: score,
                matchLevel: level,
                explanation: match.explanation || 'Good potential match',
                keyHighlights: match.keyHighlights || [],
                entity: startup
            };
        }).filter(Boolean) as MatchRecommendation[];

        const result: RecommendationResult = {
            recommendations,
            generatedAt: new Date().toISOString()
        };

        // Cache the result
        setCachedRecommendations(investor.id, 'startup', result);

        return result;
    } catch (error) {
        console.error('AI recommendation error:', error);
        throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Clear recommendation cache for a specific user
 */
export function clearRecommendationCache(userId: string, type: 'investor' | 'startup'): void {
    const key = getCacheKey(userId, type);
    recommendationCache.delete(key);
}
