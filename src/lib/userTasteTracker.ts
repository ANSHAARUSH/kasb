/**
 * User Taste Tracker
 *
 * Tracks what the user clicks/views in the feed and builds a
 * preference profile that is used to re-rank the feed dynamically.
 *
 * Preference profile is stored in localStorage per user so it persists
 * across sessions and builds up over time.
 *
 * Taste signals tracked:
 *   - Investor types (Angel, VC, Accelerator, etc.)
 *   - Investor sector focus / expertise tags
 *   - Investor stages targeted
 *   - Startup stages (for investor feed)
 *   - Startup industries (for investor feed)
 *
 * Score decay: older interactions count less (exponential decay by age).
 */

export interface TasteProfile {
    // Tags → weighted count
    investorTypes: Record<string, number>
    investorSectors: Record<string, number>
    investorStages: Record<string, number>
    startupIndustries: Record<string, number>
    startupStages: Record<string, number>
    // Raw interaction log for decay recalculation
    interactions: TasteInteraction[]
}

export interface TasteInteraction {
    type: 'investor_click' | 'startup_click'
    tags: string[]       // e.g. sectors, types, stages
    timestamp: number    // unix ms
}

const STORAGE_KEY_PREFIX = 'kasb_taste_'
const MAX_INTERACTIONS = 200      // Keep last N interactions
const DECAY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

function getKey(userId: string) {
    return `${STORAGE_KEY_PREFIX}${userId}`
}

function loadProfile(userId: string): TasteProfile {
    try {
        const raw = localStorage.getItem(getKey(userId))
        if (raw) return JSON.parse(raw) as TasteProfile
    } catch { /* ignore */ }
    return emptyProfile()
}

function saveProfile(userId: string, profile: TasteProfile) {
    try {
        localStorage.setItem(getKey(userId), JSON.stringify(profile))
    } catch { /* ignore */ }
}

function emptyProfile(): TasteProfile {
    return {
        investorTypes: {},
        investorSectors: {},
        investorStages: {},
        startupIndustries: {},
        startupStages: {},
        interactions: []
    }
}

/**
 * Exponential decay weight for an interaction.
 * Returns 1.0 for a fresh interaction, ~0.5 for 7-day-old, ~0.25 for 14-day-old.
 */
function decayWeight(timestampMs: number): number {
    const ageMs = Date.now() - timestampMs
    return Math.pow(0.5, ageMs / DECAY_HALF_LIFE_MS)
}

/**
 * Rebuilds the weighted tag maps from the raw interaction log (with decay).
 */
function rebuildWeightedMaps(profile: TasteProfile): TasteProfile {
    const investorTypes: Record<string, number> = {}
    const investorSectors: Record<string, number> = {}
    const investorStages: Record<string, number> = {}
    const startupIndustries: Record<string, number> = {}
    const startupStages: Record<string, number> = {}

    for (const interaction of profile.interactions) {
        const w = decayWeight(interaction.timestamp)
        if (interaction.type === 'investor_click') {
            for (const tag of interaction.tags) {
                const key = tag.toLowerCase().trim()
                if (isStageTag(tag)) {
                    investorStages[key] = (investorStages[key] || 0) + w
                } else if (isTypeTag(tag)) {
                    investorTypes[key] = (investorTypes[key] || 0) + w
                } else {
                    investorSectors[key] = (investorSectors[key] || 0) + w
                }
            }
        } else if (interaction.type === 'startup_click') {
            for (const tag of interaction.tags) {
                const key = tag.toLowerCase().trim()
                if (isStageTag(tag)) {
                    startupStages[key] = (startupStages[key] || 0) + w
                } else {
                    startupIndustries[key] = (startupIndustries[key] || 0) + w
                }
            }
        }
    }

    return { ...profile, investorTypes, investorSectors, investorStages, startupIndustries, startupStages }
}

const STAGE_TAGS = new Set([
    'ideation', 'pre-seed', 'seed', 'series a', 'series a+', 'series b', 'series c',
    'growth', 'pre-ipo', 'late stage', 'early stage', 'mvp'
])

const TYPE_TAGS = new Set([
    'angel', 'angel investor', 'vc', 'venture capital', 'venture capitalist',
    'accelerator', 'incubator', 'syndicate', 'family office', 'government',
    'corporate', 'institutional', 'micro vc', 'sector agnostic', 'impact investor'
])

function isStageTag(tag: string): boolean {
    return STAGE_TAGS.has(tag.toLowerCase().trim())
}

function isTypeTag(tag: string): boolean {
    return TYPE_TAGS.has(tag.toLowerCase().trim())
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Record that a user clicked/viewed an investor.
 */
export function trackInvestorClick(
    userId: string,
    investor: {
        investor_type?: string
        expertise?: string[]
        sector_focus?: string[]
        target_stages?: string[]
        type?: string
    }
) {
    const profile = loadProfile(userId)

    const tags: string[] = [
        investor.investor_type || investor.type || '',
        ...(investor.expertise || []),
        ...(investor.sector_focus || []),
        ...(investor.target_stages || []),
    ].filter(Boolean)

    const interaction: TasteInteraction = {
        type: 'investor_click',
        tags,
        timestamp: Date.now()
    }

    // Keep last N interactions
    const interactions = [...profile.interactions, interaction].slice(-MAX_INTERACTIONS)
    const updated = rebuildWeightedMaps({ ...profile, interactions })
    saveProfile(userId, updated)
}

/**
 * Record that a user clicked/viewed a startup (used in investor feed).
 */
export function trackStartupClick(
    userId: string,
    startup: {
        industry?: string
        stage?: string
        tags?: string[]
    }
) {
    const profile = loadProfile(userId)

    const tags: string[] = [
        startup.industry || '',
        startup.stage || '',
        ...(startup.tags || []),
    ].filter(Boolean)

    const interaction: TasteInteraction = {
        type: 'startup_click',
        tags,
        timestamp: Date.now()
    }

    const interactions = [...profile.interactions, interaction].slice(-MAX_INTERACTIONS)
    const updated = rebuildWeightedMaps({ ...profile, interactions })
    saveProfile(userId, updated)
}

/**
 * Get the user's current taste profile (rebuilt with decay).
 */
export function getTasteProfile(userId: string): TasteProfile {
    const profile = loadProfile(userId)
    // Re-apply decay on read so scores always reflect current time
    return rebuildWeightedMaps(profile)
}

/**
 * Compute a taste-affinity score (0–100) for an investor based on the user's profile.
 * Higher = better match with user's behavioral history.
 */
export function investorTasteScore(
    taste: TasteProfile,
    investor: {
        investor_type?: string
        expertise?: string[]
        sector_focus?: string[]
        target_stages?: string[]
    }
): number {
    const allTasteMaps = [taste.investorTypes, taste.investorSectors, taste.investorStages]
    const investorTags = [
        investor.investor_type || '',
        ...(investor.expertise || []),
        ...(investor.sector_focus || []),
        ...(investor.target_stages || []),
    ].map(t => t.toLowerCase().trim()).filter(Boolean)

    if (investorTags.length === 0) return 0

    // Sum of taste weights for matching tags
    let rawScore = 0
    let maxPossible = 0

    for (const tasteMap of allTasteMaps) {
        const topWeight = Math.max(0, ...Object.values(tasteMap))
        maxPossible += topWeight
        for (const tag of investorTags) {
            rawScore += tasteMap[tag] || 0
        }
    }

    if (maxPossible === 0) return 0
    // Normalize to 0-100
    return Math.min(100, Math.round((rawScore / maxPossible) * 100))
}

/**
 * Compute a taste-affinity score (0–100) for a startup based on the investor's profile.
 */
export function startupTasteScore(
    taste: TasteProfile,
    startup: {
        industry?: string
        stage?: string
        tags?: string[]
    }
): number {
    const allTasteMaps = [taste.startupIndustries, taste.startupStages]
    const startupTags = [
        startup.industry || '',
        startup.stage || '',
        ...(startup.tags || []),
    ].map(t => t.toLowerCase().trim()).filter(Boolean)

    if (startupTags.length === 0) return 0

    let rawScore = 0
    let maxPossible = 0

    for (const tasteMap of allTasteMaps) {
        const topWeight = Math.max(0, ...Object.values(tasteMap))
        maxPossible += topWeight
        for (const tag of startupTags) {
            rawScore += tasteMap[tag] || 0
        }
    }

    if (maxPossible === 0) return 0
    return Math.min(100, Math.round((rawScore / maxPossible) * 100))
}

/**
 * Clear the taste profile (e.g. on logout).
 */
export function clearTasteProfile(userId: string) {
    try {
        localStorage.removeItem(getKey(userId))
    } catch { /* ignore */ }
}
