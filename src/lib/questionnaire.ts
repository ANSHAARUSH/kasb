import { IDEATION_CONFIG } from './questionnaires/ideation'

import type { Question, Section, StageConfig, QuestionType } from './questionnaires/types'

export type { Question, Section, StageConfig, QuestionType }




export const QUESTIONNAIRE_CONFIG: StageConfig = {
    'Ideation': IDEATION_CONFIG,
    'Pre-seed': IDEATION_CONFIG,
    'MVP': IDEATION_CONFIG,
    'Seed': IDEATION_CONFIG,
    'Series A+': IDEATION_CONFIG
}

// Fallback for stages not explicitly matched
export const DEFAULT_STAGE_CONFIG = QUESTIONNAIRE_CONFIG['Ideation']

export function isProfileComplete(stage: string | undefined, questionnaire: Record<string, Record<string, string>> | undefined): boolean {
    const config = QUESTIONNAIRE_CONFIG[stage || 'Ideation'] || DEFAULT_STAGE_CONFIG

    if (!questionnaire) return false

    for (const section of config) {
        for (const question of section.questions) {
            if (question.required) {
                const answer = questionnaire?.[section.id]?.[question.id]
                if (!answer || answer.trim() === '') {
                    return false
                }
            }
        }
    }

    return true
}

export function isInvestorProfileComplete(investor: any): boolean {
    if (!investor) return false

    const requiredFields = [
        'name',
        'bio',
        'state',
        'city'
    ]

    for (const field of requiredFields) {
        if (!investor[field] || (typeof investor[field] === 'string' && investor[field].trim() === '')) {
            return false
        }
    }

    // Handle both naming conventions for funds
    const funds = investor.funds_available || investor.fundsAvailable
    if (!funds || (typeof funds === 'string' && funds.trim() === '')) {
        return false
    }

    // investor_type might be top-level or nested
    const type = investor.investor_type || investor.profile_details?.social_proof?.investor_type
    if (!type || (typeof type === 'string' && type.trim() === '')) {
        return false
    }

    if (!investor.expertise || !Array.isArray(investor.expertise) || investor.expertise.length === 0) {
        return false
    }

    return true
}

export function getInvestorMissingFields(investor: any): string[] {
    if (!investor) return ['Profile data']
    const missing: string[] = []
    const fieldMapping: Record<string, string> = {
        'name': 'Full Name',
        'bio': 'Investor Bio',
        'state': 'State',
        'city': 'City'
    }

    Object.keys(fieldMapping).forEach(field => {
        if (!investor[field] || (typeof investor[field] === 'string' && investor[field].trim() === '')) {
            missing.push(fieldMapping[field])
        }
    })

    const funds = investor.funds_available || investor.fundsAvailable
    if (!funds || (typeof funds === 'string' && funds.trim() === '')) {
        missing.push('Investment Budget')
    }

    const type = investor.investor_type || investor.profile_details?.social_proof?.investor_type
    if (!type || (typeof type === 'string' && type.trim() === '')) {
        missing.push('Investor Type')
    }

    if (!investor.expertise || !Array.isArray(investor.expertise) || investor.expertise.length === 0) {
        missing.push('Expertise Areas')
    }

    return missing
}

export function getStartupMissingFields(stage: string | undefined, questionnaire: Record<string, Record<string, string>> | undefined): string[] {
    const config = QUESTIONNAIRE_CONFIG[stage || 'Ideation'] || DEFAULT_STAGE_CONFIG
    if (!questionnaire) return ['Questionnaire sections']
    const missing: string[] = []

    for (const section of config) {
        for (const question of section.questions) {
            if (question.required) {
                const answer = questionnaire?.[section.id]?.[question.id]
                if (!answer || answer.trim() === '') {
                    // Group by section label to keep the list readable if many questions missing
                    if (!missing.includes(section.title)) {
                        missing.push(section.title)
                    }
                }
            }
        }
    }
    return missing
}

export function calculateStartupProgress(stage: string | undefined, questionnaire: Record<string, Record<string, string>> | undefined): number {
    const config = QUESTIONNAIRE_CONFIG[stage || 'Ideation'] || DEFAULT_STAGE_CONFIG
    let totalRequired = 0
    let answeredRequired = 0

    for (const section of config) {
        for (const question of section.questions) {
            if (question.required) {
                totalRequired++
                const answer = questionnaire?.[section.id]?.[question.id]
                if (answer && answer.trim() !== '') {
                    answeredRequired++
                }
            }
        }
    }
    return totalRequired === 0 ? 0 : Math.round((answeredRequired / totalRequired) * 100)
}

export function calculateInvestorProgress(investor: any): number {
    if (!investor) return 0

    const requiredFields = ['name', 'bio', 'state', 'city']
    let totalRequired = requiredFields.length + 3 // + funds, type, expertise
    let answered = 0

    requiredFields.forEach(field => {
        if (investor[field] && (typeof investor[field] === 'string' && investor[field].trim() !== '')) {
            answered++
        }
    })

    const funds = investor.funds_available || investor.fundsAvailable
    if (funds && (typeof funds === 'string' && funds.trim() !== '')) {
        answered++
    }

    const type = investor.investor_type || investor.profile_details?.social_proof?.investor_type
    if (type && (typeof type === 'string' && type.trim() !== '')) {
        answered++
    }

    if (investor.expertise && Array.isArray(investor.expertise) && investor.expertise.length > 0) {
        answered++
    }

    return Math.round((answered / totalRequired) * 100)
}
