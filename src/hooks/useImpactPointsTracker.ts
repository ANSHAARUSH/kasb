import { useEffect } from "react"
import { useToast } from "./useToast"
import { calculateImpactScore } from "../lib/scoring"
import type { Startup, Investor } from "../data/mockData"

export function useImpactPointsTracker(entity: Startup | Investor | null) {
    const { toast } = useToast()
    const entityId = entity?.id

    useEffect(() => {
        if (!entity || !entityId) return

        const scoreResult = calculateImpactScore(entity)
        const currentMilestones = {
            profile: scoreResult.breakdown.profile > 0,
            completion: scoreResult.breakdown.completion > 0
        }

        const notifiedKey = `notified_milestones_${entityId}`

        // Get persisted state from localStorage
        const stored = localStorage.getItem(notifiedKey)
        const persisted = stored ? JSON.parse(stored) : null

        // If no record exists for this user, initialize it with current status
        // so they don't get spammed for milestones they've already achieved in the past.
        if (!persisted) {
            localStorage.setItem(notifiedKey, JSON.stringify(currentMilestones))
            return
        }

        let updated = false
        if (currentMilestones.profile && !persisted.profile) {
            toast("Congrats! You earned 50 Impact Points for completing your profile.", "success")
            persisted.profile = true
            updated = true
        }

        if (currentMilestones.completion && !persisted.completion) {
            toast("Brilliant! You earned 50 Impact Points for finalizing your AI Summary & QA.", "success")
            persisted.completion = true
            updated = true
        }

        if (updated) {
            localStorage.setItem(notifiedKey, JSON.stringify(persisted))
        }

    }, [entityId, toast]) // Only re-run when ID changes or component renders with new entity data
}
