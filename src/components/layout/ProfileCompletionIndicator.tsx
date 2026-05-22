import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { calculateStartupProgress, calculateInvestorProgress } from "../../lib/questionnaire"
import { Link } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Modal } from "../ui/modal"
import { Button } from "../ui/button"

export function ProfileCompletionIndicator({ className }: { className?: string }) {
    const { user, role } = useAuth()
    const [progress, setProgress] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (!user || !role) return

        async function fetchProfile() {
            try {
                if (!user) return
                if (role === 'startup') {
                    const { data } = await supabase
                        .from('startups')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (data) {
                        setProgress(calculateStartupProgress(data))
                    }
                } else if (role === 'investor') {
                    const { data } = await supabase
                        .from('investors')
                        .select('*') // Need most fields for completion check
                        .eq('id', user.id)
                        .single()

                    if (data) {
                        setProgress(calculateInvestorProgress(data))
                    }
                }
            } catch (error) {
                console.error('Error fetching profile for progress:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()

        // Subscribe to changes? Maybe too expensive. 
        // Just fetching on mount is fine for now as profile updates usually happen on dedicated pages which might trigger refreshes.
    }, [user, role])

    if (loading) return null

    const isComplete = progress === 100
    const profileLink = role === 'startup' ? '/dashboard/startup/profile' : '/dashboard/investor/profile'

    // Circular Progress Logic
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={cn("group relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors", className)}
                title={`Profile Completion: ${progress}%${isComplete ? ' - Visible to others' : ''}`}
            >
                <div className="relative h-9 w-9 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="absolute h-full w-full rotate-[-90deg]" viewBox="0 0 44 44">
                        <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeOpacity="0.2"
                            strokeWidth="4"
                            className="text-white"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="transparent"
                            stroke={isComplete ? "#10b981" : "#f59e0b"} // Green if complete, Amber if not
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                        {progress}%
                    </div>
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute right-0 top-full mt-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-black text-white text-xs rounded-xl p-3 shadow-xl border border-white/10">
                        <p className="font-bold mb-1">Profile Strength: {progress}%</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed">
                            {isComplete
                                ? "Your profile is visible to others."
                                : "Complete your profile to be seen by others."}
                        </p>
                    </div>
                </div>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Complete Your Profile"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Fill out all the details in your profile tab to be visible in the feed. A complete profile increases your chances of connecting with the right people.
                    </p>

                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Link to={profileLink} onClick={() => setIsModalOpen(false)}>
                            <Button className="rounded-full bg-black text-white hover:bg-gray-800">
                                Visit Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </Modal>
        </>
    )
}
