/**
 * AI Matching Engine
 *
 * Uses the Groq API (same key as FounderGPT) to score ALL investors
 * against a startup's full profile data in a single batch call.
 *
 * Algorithm weights:
 *   65% — AI semantic match (industry, stage, philosophy, expertise)
 *   20% — Subscription plan tier (startup + investor plan)
 *   15% — Profile completeness (startup + investor)
 *
 * Results are cached in localStorage for 1 hour.
 * Falls back to static feedAlgorithm.ts scores on API failure.
 */

import { runInference } from './ai'
import { buildStartupContextBlock } from './startupContext'
import type { Investor } from '../data/mockData'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIMatchScore {
    score: number       // 0-100 final composite score
    aiScore: number     // 0-100 raw AI semantic score
    planScore: number   // 0-100 plan tier contribution
    profileScore: number // 0-100 profile completeness contribution
    reason: string      // short explanation from AI
    isAIScored: boolean // false = used static fallback
}

export type AIMatchMap = Record<string, AIMatchScore>

interface CacheEntry {
    scores: AIMatchMap
    timestamp: number
    startupId: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY = 'kasb_ai_match_cache_v2'
const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour
const MAX_INVESTORS_PER_BATCH = 25   // Reduced to stay within token limits
const AI_WEIGHT = 0.65
const PLAN_WEIGHT = 0.20
const PROFILE_WEIGHT = 0.15
const BATCH_DELAY_MS = 3000          // Delay between batches to avoid rate limits
const MAX_RETRIES = 3                // Max retries on rate limit errors

// ─── Plan Tier Scoring ───────────────────────────────────────────────────────

function startupPlanScore(tier?: string): number {
    switch (tier) {
        case 'fundraise_pro': return 100
        case 'growth':        return 75
        case 'starter':       return 50
        case 'discovery':
        default:              return 20
    }
}

function investorPlanScore(tier?: string): number {
    switch (tier) {
        case 'institutional':  return 100
        case 'investor_pro':   return 75
        case 'investor_basic': return 50
        case 'explore':
        default:               return 20
    }
}

/**
 * Combined plan score: average of startup plan + investor plan.
 * Paid-tier startups see paid-tier investors ranked higher.
 * On a free plan, you still see all investors but top-tier ones
 * are still rewarded for being active paid participants.
 */
function combinedPlanScore(startupTier: string, investorTier: string): number {
    return Math.round((startupPlanScore(startupTier) + investorPlanScore(investorTier)) / 2)
}

/**
 * Combined profile completion score: average of startup + investor %.
 */
function combinedProfileScore(startupCompletion: number, investorCompletion: number): number {
    return Math.round((startupCompletion + investorCompletion) / 2)
}

// ─── Cache Helpers ───────────────────────────────────────────────────────────

function loadCache(): CacheEntry | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const entry = JSON.parse(raw) as CacheEntry
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
        return entry
    } catch {
        return null
    }
}

function saveCache(startupId: string, scores: AIMatchMap) {
    try {
        const entry: CacheEntry = { scores, timestamp: Date.now(), startupId }
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
    } catch { /* ignore storage errors */ }
}

// ─── AI Batch Scoring ────────────────────────────────────────────────────────

/**
 * Sleep utility for rate-limit backoff.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calls the AI to score a batch of investors against the startup.
 * Returns a map of investorId → { score, reason }
 * Retries with exponential backoff on 429 rate limit errors.
 */
async function scoreInvestorBatchWithAI(
    startupContext: string,
    investors: Investor[],
    apiKey: string
): Promise<Record<string, { score: number; reason: string }>> {

    const investorList = investors.map((inv, idx) => {
        const expertise = (inv.expertise || []).join(', ') || 'General'
        const sectors = (inv.sector_focus || []).join(', ') || expertise
        const stages = (inv.target_stages || []).join(', ') || 'All stages'
        const philosophy = inv.investment_philosophy || ''
        const location = [inv.city, inv.state].filter(Boolean).join(', ') || 'India'
        return `${idx + 1}. ID:${inv.id} | ${inv.name} | Type:${inv.investor_type || 'Investor'} | Sectors:${sectors} | Stages:${stages} | Funds:${inv.fundsAvailable || 'N/A'} | Location:${location}${philosophy ? ` | Philosophy:${philosophy.substring(0, 100)}` : ''}`
    }).join('\n')

    const prompt = `You are a startup-investor matching expert. Score each investor's relevance for the following startup from 0 to 100.

STARTUP PROFILE:
${startupContext}

INVESTORS TO SCORE:
${investorList}

SCORING CRITERIA (be precise, not generic):
- Industry & sector fit (does their expertise match the startup's space?)
- Stage fit (do they invest at the startup's current stage?)
- Geographic fit (are they open to the startup's region?)
- Investment philosophy alignment
- Fund size appropriateness

HARD RULES:
- Return ONLY valid JSON, no other text
- Score must be an integer 0-100
- Reason must be max 10 words
- If investor is sector agnostic, give a moderate baseline score (50-60)

OUTPUT FORMAT (use the exact investor IDs from the list):
{
  "investor_id_here": { "score": 78, "reason": "Strong SaaS and FinTech sector match" },
  "another_id": { "score": 42, "reason": "Wrong stage focus, prefers Series B+" }
}`

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const text = await runInference(apiKey, prompt, { isJSON: true })

            // Extract JSON from response
            const jsonStart = text.indexOf('{')
            const jsonEnd = text.lastIndexOf('}')
            if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response')

            const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1))
            return parsed
        } catch (err: any) {
            const isRateLimit = err?.status === 429 ||
                err?.message?.includes('429') ||
                err?.message?.includes('Rate limit') ||
                err?.message?.includes('rate limit')

            if (isRateLimit && attempt < MAX_RETRIES - 1) {
                // Extract wait time from error message if available, otherwise use exponential backoff
                const waitMatch = err?.message?.match(/try again in (\d+\.?\d*)/i)
                const waitSeconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : (10 * Math.pow(2, attempt))
                console.warn(`[AI Match] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${waitSeconds}s...`)
                await sleep(waitSeconds * 1000)
                continue
            }

            console.error('[AI Match] Batch scoring failed:', err)
            return {}
        }
    }

    return {}
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Compute AI-powered match scores for all investors against a startup.
 *
 * Uses cached results if available (1-hour TTL).
 * Falls back to { isAIScored: false } on API failure — callers should
 * then use the static feedAlgorithm.ts scoreInvestorForStartup() instead.
 *
 * @param startupData  Raw startup row from Supabase
 * @param investors    Full investor list from useInvestors()
 * @param startupTier  Current startup's subscription tier
 * @param startupCompletion  Startup profile completion % (0-100)
 * @param apiKey  Groq API key (VITE_GROQ_API_KEY)
 */
export async function computeAIMatchScores(
    startupData: Record<string, any>,
    investors: Investor[],
    startupTier: string,
    startupCompletion: number,
    apiKey: string
): Promise<AIMatchMap> {

    const startupId = startupData?.id || 'unknown'

    // Check cache first
    const cached = loadCache()
    if (cached && cached.startupId === startupId && Object.keys(cached.scores).length > 0) {
        console.log('[AI Match] Using cached scores')
        return cached.scores
    }

    if (!apiKey) {
        console.warn('[AI Match] No API key available, skipping AI scoring')
        return {}
    }

    // Build the startup context block (same as FounderGPT training)
    const startupContext = buildStartupContextBlock(startupData)
    if (!startupContext || startupContext.trim().length < 20) {
        console.warn('[AI Match] Startup context too thin, skipping AI scoring')
        return {}
    }

    console.log('[AI Match] Computing AI scores for', investors.length, 'investors...')

    const finalScores: AIMatchMap = {}

    // Process in batches to stay within token limits
    for (let i = 0; i < investors.length; i += MAX_INVESTORS_PER_BATCH) {
        if (i > 0) {
            console.log(`[AI Match] Waiting ${BATCH_DELAY_MS}ms before next batch...`)
            await sleep(BATCH_DELAY_MS)
        }

        const batch = investors.slice(i, i + MAX_INVESTORS_PER_BATCH)
        const aiResults = await scoreInvestorBatchWithAI(startupContext, batch, apiKey)

        for (const investor of batch) {
            const aiResult = aiResults[investor.id]
            const aiScore = aiResult ? Math.min(100, Math.max(0, aiResult.score)) : 0
            const reason = aiResult?.reason || 'No AI match data'

            const planScore = combinedPlanScore(startupTier, investor.tier || 'explore')
            const profileScore = combinedProfileScore(startupCompletion, investor.completionPercentage || 0)

            // Final composite score
            const composite = Math.round(
                aiScore * AI_WEIGHT +
                planScore * PLAN_WEIGHT +
                profileScore * PROFILE_WEIGHT
            )

            finalScores[investor.id] = {
                score: composite,
                aiScore,
                planScore,
                profileScore,
                reason,
                isAIScored: !!aiResult
            }

            console.log(`[AI Match] ${investor.name}: AI=${aiScore} Plan=${planScore} Profile=${profileScore} → Final=${composite} | ${reason}`)
        }
    }

    saveCache(startupId, finalScores)
    return finalScores
}

/**
 * Invalidate the AI match cache (call when startup profile changes).
 */
export function invalidateAIMatchCache() {
    try {
        localStorage.removeItem(CACHE_KEY)
    } catch { /* ignore */ }
}
