/**
 * Feed Ranking Algorithm
 * 
 * Client-side weighted scoring for ranking startups and investors in feeds.
 * Runs entirely from already-fetched data — zero API calls.
 */

import type { Startup, Investor } from '../data/mockData'
import { parseRevenue } from './utils'

// ─── Helper Scoring Functions ───────────────────────────────────────────────

/**
 * Recency score based on last_active_at timestamp.
 * Active in last 24h = 100, 7d = 70, 30d = 40, older = 10
 */
function recencyScore(lastActiveAt?: string): number {
    if (!lastActiveAt) return 10

    const now = Date.now()
    const lastActive = new Date(lastActiveAt).getTime()
    const hoursSince = (now - lastActive) / (1000 * 60 * 60)

    if (hoursSince <= 24) return 100
    if (hoursSince <= 24 * 7) return 70
    if (hoursSince <= 24 * 30) return 40
    return 10
}

/**
 * Verification level score.
 * trusted = 100, verified = 70, basic = 30
 */
function verificationScore(level?: 'basic' | 'verified' | 'trusted'): number {
    switch (level) {
        case 'trusted': return 100
        case 'verified': return 70
        case 'basic':
        default: return 30
    }
}

/**
 * Subscription tier score for startups.
 * fundraise_pro = 100, growth = 80, starter = 50, discovery = 20
 */
function startupTierScore(tier?: string): number {
    switch (tier) {
        case 'fundraise_pro': return 100
        case 'growth': return 80
        case 'starter': return 50
        case 'discovery':
        default: return 20
    }
}

/**
 * Subscription tier score for investors.
 * institutional = 100, investor_pro = 80, investor_basic = 50, explore = 20
 */
function investorTierScore(tier?: string): number {
    switch (tier) {
        case 'institutional': return 100
        case 'investor_pro': return 80
        case 'investor_basic': return 50
        case 'explore':
        default: return 20
    }
}

/**
 * Profile completeness score.
 * Maps the 0-100 completionPercentage directly to a 0-100 score.
 */
function completionScore(completionPercentage?: number): number {
    return Math.min(100, Math.max(0, completionPercentage || 0))
}

/**
 * Industry/expertise match score.
 * Counts overlapping tags between two sets and normalizes.
 * Returns 0 if either set is empty, 100 if 3+ overlaps.
 */
function industryMatchScore(tagsA: string[], tagsB: string[]): number {
    if (tagsA.length === 0 || tagsB.length === 0) return 0

    const setA = new Set(tagsA.map(t => t.toLowerCase().trim()))
    const setB = new Set(tagsB.map(t => t.toLowerCase().trim()))

    let overlapCount = 0
    for (const tag of setA) {
        // Check for exact match or partial containment
        for (const other of setB) {
            if (tag === other || tag.includes(other) || other.includes(tag)) {
                overlapCount++
                break // Don't double-count
            }
        }
    }

    // Normalize: 1 overlap = 40, 2 = 70, 3+ = 100
    if (overlapCount >= 3) return 100
    if (overlapCount === 2) return 70
    if (overlapCount === 1) return 40
    return 0
}

/**
 * Geographic proximity score.
 * Same city = 100, same state = 60, same country = 20, different = 0
 */
function geoProximityScore(
    entityState?: string,
    entityCity?: string,
    viewerState?: string,
    viewerCity?: string
): number {
    if (!entityState && !entityCity) return 0
    if (!viewerState && !viewerCity) return 0

    const eCity = (entityCity || '').toLowerCase().trim()
    const vCity = (viewerCity || '').toLowerCase().trim()
    const eState = (entityState || '').toLowerCase().trim()
    const vState = (viewerState || '').toLowerCase().trim()

    if (eCity && vCity && eCity === vCity) return 100
    if (eState && vState && eState === vState) return 60
    return 0
}

/**
 * Funds available score, normalized.
 * Uses parseRevenue to convert strings like "$5M" to numbers.
 * Caps at 100 for $50M+
 */
function fundsScore(fundsAvailable?: string): number {
    if (!fundsAvailable) return 0
    const amount = parseRevenue(fundsAvailable)
    if (amount <= 0) return 0
    // Scale: $1M = 20, $5M = 40, $10M = 60, $25M = 80, $50M+ = 100
    if (amount >= 50_000_000) return 100
    if (amount >= 25_000_000) return 80
    if (amount >= 10_000_000) return 60
    if (amount >= 5_000_000) return 40
    if (amount >= 1_000_000) return 20
    return 10
}

/**
 * Investment count score, normalized.
 * 10+ investments = 100, 5 = 60, 1 = 20, 0 = 0
 */
function investmentCountScore(count?: number): number {
    if (!count || count <= 0) return 0
    if (count >= 10) return 100
    if (count >= 5) return 60
    if (count >= 3) return 40
    return 20
}


// ─── Main Scoring Functions ─────────────────────────────────────────────────

export interface FeedScoreResult {
    total: number
    breakdown: Record<string, number>
}

/**
 * Score a startup for an investor's feed.
 * 
 * Weights:
 *   Profile Completeness  30%
 *   Industry Match         25%
 *   Geographic Proximity   15%
 *   Recency                10%
 *   Verification Level     10%
 *   Subscription Tier      10%
 */
export function scoreStartupForInvestor(
    startup: Startup,
    investorExpertise: string[],
    investorIndustryFocus: string[],
    investorState?: string,
    investorCity?: string
): FeedScoreResult {
    const profileScore = completionScore(startup.completionPercentage)

    // Combine investor's expertise and industry_focus for matching
    const investorTags = [...new Set([...investorExpertise, ...investorIndustryFocus])]
    const startupTags = [...(startup.tags || []), startup.industry || ''].filter(Boolean)
    const industryScore = industryMatchScore(startupTags, investorTags)

    const geoScore = geoProximityScore(startup.state, startup.city, investorState, investorCity)
    const recentScore = recencyScore(startup.last_active_at)
    const verifyScore = verificationScore(startup.verificationLevel)
    const tierScore = startupTierScore(startup.tier)

    const total =
        profileScore * 0.30 +
        industryScore * 0.25 +
        geoScore * 0.15 +
        recentScore * 0.10 +
        verifyScore * 0.10 +
        tierScore * 0.10

    return {
        total: Math.round(total * 100) / 100,
        breakdown: {
            profile: profileScore,
            industry: industryScore,
            geo: geoScore,
            recency: recentScore,
            verification: verifyScore,
            tier: tierScore
        }
    }
}

/**
 * Score an investor for a startup's feed.
 * 
 * Weights:
 *   Industry Match         25%
 *   Geographic Proximity   20%
 *   Profile Completeness   15%
 *   Verification Level     10%
 *   Subscription Tier      10%
 *   Recency                10%
 *   Funds Available         5%
 *   Investment Count        5%
 */
export function scoreInvestorForStartup(
    investor: Investor,
    startupTags: string[],
    startupIndustry: string,
    startupState?: string,
    startupCity?: string
): FeedScoreResult {
    // Combine investor expertise + sector_focus for matching
    const investorTags = [
        ...(investor.expertise || []),
        ...(investor.sector_focus || []),
        ...(investor.profile_details?.investment_preferences?.industry_focus || [])
    ].filter(Boolean)
    const targetTags = [...startupTags, startupIndustry].filter(Boolean)
    const industryScore = industryMatchScore(investorTags, targetTags)

    const geoScore = geoProximityScore(investor.state, investor.city, startupState, startupCity)
    const profileScore = completionScore(investor.completionPercentage)
    const verifyScore = verificationScore(investor.verificationLevel)
    const tierScore = investorTierScore(investor.tier)
    const recentScore = recencyScore(investor.last_active_at)
    const funds = fundsScore(investor.fundsAvailable)
    const investments = investmentCountScore(investor.investments)

    const total =
        industryScore * 0.25 +
        geoScore * 0.20 +
        profileScore * 0.15 +
        verifyScore * 0.10 +
        tierScore * 0.10 +
        recentScore * 0.10 +
        funds * 0.05 +
        investments * 0.05

    return {
        total: Math.round(total * 100) / 100,
        breakdown: {
            industry: industryScore,
            geo: geoScore,
            profile: profileScore,
            verification: verifyScore,
            tier: tierScore,
            recency: recentScore,
            funds,
            investments
        }
    }
}

/**
 * Sort entities by algorithm score, deprioritizing saved ones (but keeping at least one).
 * 
 * Saved entities are pushed to the bottom of the list rather than filtered out,
 * guaranteeing they appear at least once in the feed.
 */
export function sortWithSavedDeprioritization<T extends { id: string }>(
    scored: { entity: T; score: number }[],
    savedIds: string[]
): T[] {
    const savedSet = new Set(savedIds)

    // Split into unsaved and saved
    const unsaved = scored.filter(s => !savedSet.has(s.entity.id))
    const saved = scored.filter(s => savedSet.has(s.entity.id))

    // Sort each group by score descending
    unsaved.sort((a, b) => b.score - a.score)
    saved.sort((a, b) => b.score - a.score)

    // Unsaved first, then saved at the bottom (guaranteed to appear)
    return [...unsaved, ...saved].map(s => s.entity)
}
