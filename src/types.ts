export interface StartupDB {
    id: string
    name: string
    logo: string
    description: string
    valuation: string
    stage: string
    traction: string
    email_verified: boolean
    show_in_feed: boolean
    founder_name: string
    founder_avatar: string
    founder_bio: string
    founder_education: string
    founder_work_history: string
    history: string
    tags: string[]
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    problem_solving?: string
    industry?: string
}

export interface InvestorDB {
    id: string
    name: string
    avatar: string
    funds_available: string
    investments_count: number
    title: string
    bio: string
    adhaar_number?: string
    adhaar_doc_url?: string
    verification_level: 'basic' | 'verified' | 'trusted'
    review_requested?: boolean
    expertise?: string[]
}
export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read: boolean
    is_deleted?: boolean
    last_edited_at?: string
}

export interface ChatUser {
    id: string
    name: string
    avatar: string
    role?: 'startup' | 'investor'
}
