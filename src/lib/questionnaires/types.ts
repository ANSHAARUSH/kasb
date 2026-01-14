export type QuestionType = 'text' | 'textarea' | 'number' | 'select'

export interface Question {
    id: string
    label: string
    type: QuestionType
    placeholder?: string
    options?: string[] // for select
    required?: boolean
    helperText?: string
}

export interface Section {
    id: string
    title: string
    description?: string
    questions: Question[]
}

export interface StageConfig {
    [stageId: string]: Section[]
}
