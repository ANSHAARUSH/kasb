import type { StartupProfileData } from '../hooks/useStartupProfile'

/**
 * Builds a concise, structured founder context string from the user's startup profile.
 * This is injected into the AI system prompt so chatbots can give personalized advice.
 * 
 * Designed to stay under ~800 tokens to avoid bloating the prompt window.
 */
export function buildFounderContext(profile: StartupProfileData | null): string {
    if (!profile) return ''

    const lines: string[] = []

    lines.push('=== YOUR FOUNDER\'S STARTUP PROFILE ===')

    // Core identity
    if (profile.name) lines.push(`Startup Name: ${profile.name}`)
    if (profile.industry) lines.push(`Industry: ${profile.industry}`)
    if (profile.stage) lines.push(`Stage: ${profile.stage}`)
    if (profile.valuation) lines.push(`Valuation: ${profile.valuation}`)
    if (profile.traction) lines.push(`Traction: ${truncate(profile.traction, 200)}`)
    if (profile.description) lines.push(`Description: ${truncate(profile.description, 250)}`)
    if (profile.problem_solving) lines.push(`Problem & Solution: ${truncate(profile.problem_solving, 250)}`)

    // Founder info
    if (profile.founder_name) lines.push(`Founder: ${profile.founder_name}`)
    if (profile.founder_bio) lines.push(`Founder Bio: ${truncate(profile.founder_bio, 200)}`)

    // Location
    const location = [profile.city, profile.state].filter(Boolean).join(', ')
    if (location) lines.push(`Location: ${location}`)

    // Tags
    if (profile.tags && profile.tags.length > 0) {
        lines.push(`Tags/Focus Areas: ${profile.tags.join(', ')}`)
    }

    // Verification
    if (profile.verification_level && profile.verification_level !== 'basic') {
        lines.push(`Verification: ${profile.verification_level}`)
    }

    // AI Summary (if already generated)
    if (profile.ai_summary) {
        lines.push(`AI Summary: ${truncate(profile.ai_summary, 200)}`)
    }

    // Questionnaire answers — flatten into readable key-value pairs
    if (profile.questionnaire && typeof profile.questionnaire === 'object') {
        const qLines: string[] = []
        for (const [sectionId, section] of Object.entries(profile.questionnaire)) {
            if (section && typeof section === 'object') {
                for (const [questionId, answer] of Object.entries(section)) {
                    if (answer && typeof answer === 'string' && answer.trim() !== '') {
                        // Convert snake_case/camelCase IDs to readable labels
                        const label = questionId
                            .replace(/_/g, ' ')
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^\w/, c => c.toUpperCase())
                            .trim()
                        qLines.push(`  ${label}: ${truncate(answer, 150)}`)
                    }
                }
            }
        }
        if (qLines.length > 0) {
            lines.push('\nDetailed Questionnaire Answers:')
            lines.push(...qLines)
        }
    }

    lines.push('=== END OF PROFILE ===')

    return lines.join('\n')
}

/**
 * Creates a lightweight hash string from key profile fields.
 * Used to detect whether the profile has changed since the last context build.
 */
export function hashProfile(profile: StartupProfileData | null): string {
    if (!profile) return ''
    const key = [
        profile.name,
        profile.industry,
        profile.stage,
        profile.valuation,
        profile.traction,
        profile.description,
        profile.problem_solving,
        profile.founder_name,
        profile.founder_bio,
        profile.city,
        profile.state,
        profile.ai_summary,
        JSON.stringify(profile.tags),
        JSON.stringify(profile.questionnaire),
    ].join('|')

    // Simple DJB2 hash
    let hash = 5381
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) + hash) + key.charCodeAt(i)
        hash = hash & hash // Convert to 32-bit integer
    }
    return String(Math.abs(hash))
}

/** Truncate a string to a max length, appending "..." if needed */
function truncate(val: string | null | undefined, max: number): string {
    if (!val) return ''
    return val.length > max ? val.substring(0, max) + '...' : val
}
