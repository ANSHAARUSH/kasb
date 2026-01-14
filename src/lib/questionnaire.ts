import { IDEATION_CONFIG } from './questionnaires/ideation'
import { MVP_PRESEED_CONFIG } from './questionnaires/mvp_preseed'
import { SEED_CONFIG } from './questionnaires/seed'
import { SERIES_A_CONFIG } from './questionnaires/series_a'
import type { Question, Section, StageConfig, QuestionType } from './questionnaires/types'

export type { Question, Section, StageConfig, QuestionType }




export const QUESTIONNAIRE_CONFIG: StageConfig = {
    'Ideation': IDEATION_CONFIG,
    'Pre-seed': MVP_PRESEED_CONFIG,
    'MVP': MVP_PRESEED_CONFIG,
    'Seed': SEED_CONFIG,
    'Series A+': SERIES_A_CONFIG
}

// Fallback for stages not explicitly matched
export const DEFAULT_STAGE_CONFIG = QUESTIONNAIRE_CONFIG['Ideation']

export function isProfileComplete(stage: string | undefined, questionnaire: Record<string, Record<string, string>> | undefined): boolean {
    const config = QUESTIONNAIRE_CONFIG[stage || 'Ideation'] || DEFAULT_STAGE_CONFIG

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
