import { useEffect, useRef } from "react"
import { useToast } from "./useToast"
import { calculateImpactScore } from "../lib/scoring"
import type { Startup, Investor } from "../data/mockData"

export function useImpactPointsTracker(entity: Startup | Investor | null) {
    const { toast } = useToast()
    const prevMilestones = useRef<{ signup: boolean; profile: boolean; completion: boolean }>({
        signup: false,
        profile: false,
        completion: false
    })

    useEffect(() => {
        if (!entity) return

        const scoreResult = calculateImpactScore(entity)
        const currentMilestones = {
            signup: scoreResult.breakdown.signup > 0,
            profile: scoreResult.breakdown.profile > 0,
            completion: scoreResult.breakdown.completion > 0
        }

        // Initialize prevent noise on first load
        if (!prevMilestones.current.signup && currentMilestones.signup) {
            // Usually signup is always true, so we don't notify unless it's a "brand new" session state
            // But for existing users, we don't want to spam them on every refresh.
            // We'll use a session-based or local-storage based check if we want persistence.
            prevMilestones.current.signup = true
        }

        if (!prevMilestones.current.profile && currentMilestones.profile) {
            toast("Congrats! You earned 50 Impact Points for completing your profile.", "success")
            prevMilestones.current.profile = true
        }

        if (!prevMilestones.current.completion && currentMilestones.completion) {
            toast("Brilliant! You earned 50 Impact Points for finalizing your AI Summary & QA.", "success")
            prevMilestones.current.completion = true
        }

    }, [entity, toast])
}
