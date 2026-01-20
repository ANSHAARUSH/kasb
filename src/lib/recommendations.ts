import OpenAI from "openai";
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
 * Generate personalized investor recommendations for a startup
 */
export async function generateInvestorRecommendations(
    startup: Startup,
    investors: Investor[],
    apiKey: string
): Promise<RecommendationResult> {
    // Check cache first
    const cached = getCachedRecommendations(startup.id, 'startup');
    if (cached) {
        console.log('Returning cached investor recommendations');
        return cached;
    }

    const client = new OpenAI({
        apiKey,
        baseURL: apiKey.startsWith('gsk_') ? 'https://api.groq.com/openai/v1' : undefined,
        dangerouslyAllowBrowser: true
    });

    const startupContext = `
Startup Profile:
- Name: ${startup.name}
- Industry: ${startup.industry || 'Not specified'}
- Stage: ${startup.metrics.stage}
- Traction: ${startup.metrics.traction}
- Valuation: ${startup.metrics.valuation}
- Problem: ${startup.problemSolving}
- Description: ${startup.description || 'Not provided'}
`;

    const investorsContext = investors.map((inv, idx) => `
Investor ${idx + 1}:
- ID: ${inv.id}
- Name: ${inv.name}
- Funds Available: ${inv.fundsAvailable}
- Expertise: ${inv.expertise.join(', ')}
- Portfolio Size: ${inv.investments} investments
- Bio: ${inv.bio}
`).join('\n');

    const prompt = `You are an expert startup-investor matching AI. Analyze the startup profile and rank the investors based on fit.

${startupContext}

Available Investors:
${investorsContext}

For each investor, provide:
1. Match score (0-100)
2. Match level (high/medium/low)
3. Brief explanation (2-3 sentences max)
4. 2-3 key highlights (short phrases)

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "investorId": "string",
      "matchScore": number,
      "matchLevel": "high" | "medium" | "low",
      "explanation": "string",
      "keyHighlights": ["string", "string"]
    }
  ]
}

Rank by match score (highest first). Include all investors.`;

    try {
        const response = await client.chat.completions.create({
            model: apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);

        const recommendations: MatchRecommendation[] = parsed.matches.map((match: any) => {
            const investor = investors.find(inv => inv.id === match.investorId);
            if (!investor) return null;

            return {
                id: investor.id,
                matchScore: match.matchScore,
                matchLevel: match.matchLevel,
                explanation: match.explanation,
                keyHighlights: match.keyHighlights,
                entity: investor
            };
        }).filter(Boolean) as MatchRecommendation[];

        const result: RecommendationResult = {
            recommendations,
            generatedAt: new Date().toISOString()
        };

        // Cache the result
        setCachedRecommendations(startup.id, 'startup', result);

        return result;
    } catch (error: any) {
        console.error('AI recommendation error:', error);

        // Handle rate limit errors specifically
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
            throw new Error('AI rate limit reached. Please try again in a few minutes or configure an OpenAI API key as a fallback.');
        }

        // Handle API key errors
        if (error.message?.includes('API key') || error.message?.includes('401')) {
            throw new Error('AI API key is invalid or missing. Please check your configuration.');
        }

        throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
}

/**
 * Generate personalized startup recommendations for an investor
 */
export async function generateStartupRecommendations(
    investor: Investor,
    startups: Startup[],
    apiKey: string
): Promise<RecommendationResult> {
    // Check cache first
    const cached = getCachedRecommendations(investor.id, 'investor');
    if (cached) {
        console.log('Returning cached startup recommendations');
        return cached;
    }

    const client = new OpenAI({
        apiKey,
        baseURL: apiKey.startsWith('gsk_') ? 'https://api.groq.com/openai/v1' : undefined,
        dangerouslyAllowBrowser: true
    });

    const investorContext = `
Investor Profile:
- Name: ${investor.name}
- Funds Available: ${investor.fundsAvailable}
- Expertise: ${investor.expertise.join(', ')}
- Portfolio Size: ${investor.investments} investments
- Bio: ${investor.bio}
`;

    const startupsContext = startups.map((startup, idx) => `
Startup ${idx + 1}:
- ID: ${startup.id}
- Name: ${startup.name}
- Industry: ${startup.industry || 'Not specified'}
- Stage: ${startup.metrics.stage}
- Traction: ${startup.metrics.traction}
- Valuation: ${startup.metrics.valuation}
- Problem: ${startup.problemSolving}
`).join('\n');

    const prompt = `You are an expert startup-investor matching AI. Analyze the investor profile and rank the startups based on fit.

${investorContext}

Available Startups:
${startupsContext}

For each startup, provide:
1. Match score (0-100)
2. Match level (high/medium/low)
3. Brief explanation (2-3 sentences max)
4. 2-3 key highlights (short phrases)

Return ONLY valid JSON in this exact format:
{
  "matches": [
    {
      "startupId": "string",
      "matchScore": number,
      "matchLevel": "high" | "medium" | "low",
      "explanation": "string",
      "keyHighlights": ["string", "string"]
    }
  ]
}

Rank by match score (highest first). Include all startups.`;

    try {
        const response = await client.chat.completions.create({
            model: apiKey.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);

        const recommendations: MatchRecommendation[] = parsed.matches.map((match: any) => {
            const startup = startups.find(s => s.id === match.startupId);
            if (!startup) return null;

            return {
                id: startup.id,
                matchScore: match.matchScore,
                matchLevel: match.matchLevel,
                explanation: match.explanation,
                keyHighlights: match.keyHighlights,
                entity: startup
            };
        }).filter(Boolean) as MatchRecommendation[];

        const result: RecommendationResult = {
            recommendations,
            generatedAt: new Date().toISOString()
        };

        // Cache the result
        setCachedRecommendations(investor.id, 'investor', result);

        return result;
    } catch (error: any) {
        console.error('AI recommendation error:', error);

        // Handle rate limit errors specifically
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
            throw new Error('AI rate limit reached. Please try again in a few minutes or configure an OpenAI API key as a fallback.');
        }

        // Handle API key errors
        if (error.message?.includes('API key') || error.message?.includes('401')) {
            throw new Error('AI API key is invalid or missing. Please check your configuration.');
        }

        throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
}

/**
 * Clear recommendation cache for a specific user
 */
export function clearRecommendationCache(userId: string, type: 'investor' | 'startup'): void {
    const key = getCacheKey(userId, type);
    recommendationCache.delete(key);
}
