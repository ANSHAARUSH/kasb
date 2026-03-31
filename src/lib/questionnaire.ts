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

export function isProfileComplete(startup: any): boolean {
    if (!startup) return false
    const stage = startup.stage || startup.metrics?.stage || 'Ideation'
    const questionnaire = startup.questionnaire
    const config = QUESTIONNAIRE_CONFIG[stage] || DEFAULT_STAGE_CONFIG

    // 1. Check Core Fields
    const coreFields = [
        'name', 'logo', 'industry', 'description', 
        'problem_solving', 'founder_name', 'founder_avatar', 'founder_bio',
        'valuation', 'traction'
    ]
    for (const field of coreFields) {
        let val = startup[field]
        if (field === 'problem_solving' && !val) val = startup.problemSolving
        if (field === 'valuation' || field === 'traction') val = val || startup.metrics?.[field]
        if (field.startsWith('founder_')) val = val || startup.founder?.[field.replace('founder_', '')]
        
        if (!val || (typeof val === 'string' && val.trim() === '')) return false
    }

    // 2. Check Required Questionnaire
    if (!questionnaire) return false
    for (const section of config) {
        for (const question of section.questions) {
            if (question.required) {
                const answer = questionnaire?.[section.id]?.[question.id]
                if (!answer || answer.trim() === '') return false
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
        'avatar',
        'state',
        'city'
    ]

    for (const field of requiredFields) {
        if (!investor[field] || (typeof investor[field] === 'string' && investor[field].trim() === '')) {
            return false
        }
    }

    const funds = investor.funds_available || investor.fundsAvailable
    if (!funds || (typeof funds === 'string' && funds.trim() === '')) return false

    const type = investor.investor_type || investor.profile_details?.social_proof?.investor_type
    if (!type || (typeof type === 'string' && type.trim() === '')) return false

    if (!investor.expertise || !Array.isArray(investor.expertise) || investor.expertise.length === 0) return false

    return true
}

export function getStartupMissingFields(startup: any): string[] {
    if (!startup) return ['Profile data']
    const stage = startup.stage || startup.metrics?.stage || 'Ideation'
    const questionnaire = startup.questionnaire
    const config = QUESTIONNAIRE_CONFIG[stage] || DEFAULT_STAGE_CONFIG
    const missing: string[] = []

    // 1. Check Core Fields
    const fieldMapping: Record<string, string> = {
        'name': 'Startup Name',
        'logo': 'Startup Logo',
        'industry': 'Industry',
        'description': 'Description',
        'problem_solving': 'Problem & Solution',
        'founder_name': 'Founder Name',
        'founder_avatar': 'Founder Photo',
        'founder_bio': 'Founder Bio',
        'valuation': 'Valuation',
        'traction': 'Traction'
    }

    Object.keys(fieldMapping).forEach(field => {
        let val = startup[field]
        if (field === 'problem_solving' && !val) val = startup.problemSolving
        if (field === 'valuation' || field === 'traction') val = val || startup.metrics?.[field]
        if (field.startsWith('founder_')) val = val || startup.founder?.[field.replace('founder_', '')]

        if (!val || (typeof val === 'string' && val.trim() === '')) {
            missing.push(fieldMapping[field])
        }
    })

    // 2. Check Questionnaire
    if (!questionnaire) {
        missing.push('Questionnaire')
    } else {
        for (const section of config) {
            for (const question of section.questions) {
                if (question.required) {
                    const answer = questionnaire?.[section.id]?.[question.id]
                    if (!answer || answer.trim() === '') {
                        if (!missing.includes(section.title)) {
                            missing.push(section.title)
                        }
                    }
                }
            }
        }
    }
    return missing
}

export function getInvestorMissingFields(investor: any): string[] {
    if (!investor) return ['Profile data']
    const missing: string[] = []
    const fieldMapping: Record<string, string> = {
        'name': 'Full Name',
        'bio': 'Investor Bio',
        'avatar': 'Profile Photo',
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

export function calculateStartupProgress(startup: any): number {
    if (!startup) return 0
    const stage = startup.stage || startup.metrics?.stage || 'Ideation'
    const questionnaire = startup.questionnaire
    const config = QUESTIONNAIRE_CONFIG[stage] || DEFAULT_STAGE_CONFIG
    
    let totalFields = 0
    let answeredFields = 0

    // 1. Core Profile Fields (10)
    const coreFields = [
        'name', 'logo', 'industry', 'description', 
        'problem_solving', 'founder_name', 'founder_avatar', 'founder_bio',
        'valuation', 'traction'
    ]
    
    coreFields.forEach(field => {
        totalFields++
        let val = startup[field]
        if (field === 'problem_solving' && !val) val = startup.problemSolving
        if (field === 'valuation' || field === 'traction') val = val || startup.metrics?.[field]
        if (field.startsWith('founder_')) val = val || startup.founder?.[field.replace('founder_', '')]

        if (val && (typeof val === 'string' && val.trim() !== '')) {
            answeredFields++
        }
    })

    // 2. Questionnaire Questions
    for (const section of config) {
        for (const question of section.questions) {
            totalFields++
            const answer = questionnaire?.[section.id]?.[question.id]
            if (answer && answer.trim() !== '') {
                answeredFields++
            }
        }
    }

    return totalFields === 0 ? 0 : Math.round((answeredFields / totalFields) * 100)
}

export function calculateInvestorProgress(investor: any): number {
    if (!investor) return 0

    const requiredFields = ['name', 'bio', 'avatar', 'state', 'city']
    let totalFields = requiredFields.length + 3 // + funds, type, expertise
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

    return Math.round((answered / totalFields) * 100)
}
