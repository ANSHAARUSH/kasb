import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { useToast } from "./useToast"

interface UseSavedEntitiesProps {
    tableName: string
    userColumn: string
    targetColumn: string
}

export function useSavedEntities({ tableName, userColumn, targetColumn }: UseSavedEntitiesProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [savedIds, setSavedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user) {
            setSavedIds([])
            return
        }

        const fetchSaved = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from(tableName)
                .select(targetColumn)
                .eq(userColumn, user.id)

            if (data) {
                setSavedIds(data.map((item: any) => item[targetColumn]))
            }
            if (error) {
                console.error(`Error fetching saved entities from ${tableName}:`, error)
            }
            setLoading(false)
        }

        fetchSaved()
    }, [user, tableName, userColumn, targetColumn])

    const toggleSave = async (targetId: string, entityName: string = "Item") => {
        if (!user) {
            toast("You must be logged in to save items.", "error")
            return
        }

        const isSaved = savedIds.includes(targetId)

        try {
            if (isSaved) {
                // Remove
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq(userColumn, user.id)
                    .eq(targetColumn, targetId)

                if (error) throw error

                setSavedIds(prev => prev.filter(id => id !== targetId))
                toast(`Removed from saved ${entityName}s`, "info")
            } else {
                // Add
                const { error } = await supabase
                    .from(tableName)
                    .insert([
                        {
                            [userColumn]: user.id,
                            [targetColumn]: targetId
                        }
                    ])

                if (error) {
                    if (error.code === '23505') { // Unique violation
                        setSavedIds(prev => [...prev, targetId])
                        toast("Already saved!", "info")
                    } else {
                        throw error
                    }
                } else {
                    setSavedIds(prev => [...prev, targetId])
                    toast(`Saved ${entityName}!`, "success")
                }
            }
        } catch (err: unknown) {
            console.error("Error toggling save:", err)
            const message = err instanceof Error ? err.message : "Failed to update. Please try again.";
            toast(message, "error")
        }
    }

    return { savedIds, toggleSave, loading }
}
