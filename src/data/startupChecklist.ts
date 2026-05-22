export interface ChecklistItem {
    id: string
    label: string
    description?: string
    isMandatory?: boolean
}

export interface ChecklistCategory {
    title: string
    items: ChecklistItem[]
}

export type StartupStage = 'Idea' | 'MVP' | 'Seed' | 'Growth'

/**
 * Normalizes any string stage name (including legacy names) to one of the 4 canonical stages.
 */
export function normalizeStage(stage?: string): StartupStage {
    if (!stage) return 'Idea';

    const s = stage.toLowerCase().trim();

    if (s.includes('ideation') || s.includes('pre-seed') || s.includes('idea')) return 'Idea';
    if (s.includes('mvp') || s.includes('prototype')) return 'MVP';
    if (s.includes('seed')) return 'Seed';
    if (s.includes('growth') || s.includes('series') || s.includes('scaled')) return 'Growth';

    return 'Idea'; // Default fallback
}

export interface DocumentChecklist {
    id: string
    label: string
    category: string
    isMandatory: boolean
    description?: string
}

export const UNIVERSAL_DOCUMENTS: DocumentChecklist[] = [
    { id: 'pitch_deck', label: 'Pitch Deck (PPTX)', category: '02_Pitch_Deck', isMandatory: true, description: 'Main presentation of your business, market, and team. PowerPoint format preferred.' },
]

export const STAGE_SPECIFIC_LOGIC: Record<StartupStage, { mandatory: DocumentChecklist[], optional: DocumentChecklist[] }> = {
    'Idea': {
        mandatory: [],
        optional: []
    },
    'MVP': {
        mandatory: [],
        optional: []
    },
    'Seed': {
        mandatory: [],
        optional: []
    },
    'Growth': {
        mandatory: [],
        optional: []
    }
}

export const DATA_ROOM_STRUCTURE = [
    "01_Founders", "02_Pitch_Deck", "03_Product", "04_Market_Research",
    "05_Traction", "06_Financials", "07_Legal", "08_IP", "09_Governance", "10_Misc"
]
