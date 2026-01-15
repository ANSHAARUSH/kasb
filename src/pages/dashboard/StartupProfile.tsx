import { Button } from "../../components/ui/button"
import { useState } from "react"
import { Pencil, Trash2, Zap, LogOut } from "lucide-react"
import { Link } from "react-router-dom"
import { useStartupProfile } from "../../hooks/useStartupProfile"
import { ProfileView } from "./startup/ProfileView"
import { EditProfileModal } from "./startup/EditProfileModal"
import { DeleteAccountModal } from "../../components/dashboard/DeleteAccountModal"
import { getGlobalConfig, getUserSetting, supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import { Sparkles, FileText, Loader2 } from "lucide-react"
import { reviewPitchDeck } from "../../lib/ai"
import { useToast } from "../../hooks/useToast"
import { subscriptionManager } from "../../lib/subscriptionManager"

export function StartupProfile() {
    const { startup, loading, saving, updateProfile, requestReview } = useStartupProfile()
    const { user, signOut } = useAuth()
    const { toast } = useToast()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deckReview, setDeckReview] = useState<string | null>(null)
    const [isReviewing, setIsReviewing] = useState(false)

    const handleDeleteAccount = async () => {
        try {
            const { error } = await supabase.rpc('delete_user_account')
            if (error) {
                console.error('Account deletion error:', error)
                const detailedError = error.details || error.hint || error.message
                throw new Error(detailedError)
            }
            await signOut()
            window.location.href = '/'
        } catch (err: any) {
            const message = err?.message || "An unknown error occurred"
            alert("Error deleting account: " + message)
        }
    }

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 font-medium">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-3xl" />
                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-200 rounded-md" />
                </div>
            </div>
        )
    }

    if (!startup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Startup Profile Not Found</h3>
                <p className="text-gray-500 max-w-md mb-6">
                    We couldn't load your startup profile. This usually happens if the account setup wasn't completed properly.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Retry
                    </Button>
                    <Button onClick={() => signOut()} variant="default">
                        Sign Out
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="pb-24 max-w-4xl mx-auto px-4 pt-4 sm:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage your startup identity</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link to="/dashboard/pricing">
                        <Button
                            variant="outline"
                            className="rounded-xl h-9 font-bold border-gray-200 gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                            <Zap className="h-4 w-4 fill-indigo-600" />
                            Manage Plan
                        </Button>
                    </Link>
                    <Button
                        onClick={() => signOut()}
                        variant="outline"
                        className="rounded-xl h-9 font-bold border-gray-200 gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                    <Button
                        onClick={() => setIsEditOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 h-9 rounded-xl font-bold gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            <ProfileView
                startup={startup}
                onRequestReview={requestReview}
                onSave={updateProfile}
                saving={saving}
                onMarkAsLive={() => { }}
            />

            {/* AI Pitch Deck Review Section */}
            <div className="mt-8 sm:mt-12 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-indigo-50 border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="h-8 w-8 text-indigo-200" />
                </div>

                <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    AI Pitch Deck Review
                </h3>
                <p className="text-indigo-700/70 text-sm mb-6 max-w-md">
                    Get critical, constructive feedback on your pitch deck from an investor's perspective.
                </p>

                {!deckReview ? (
                    <Button
                        onClick={async () => {
                            setIsReviewing(true)
                            try {
                                let apiKey = import.meta.env.VITE_GROQ_API_KEY
                                if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || ''
                                if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || ''

                                if (!apiKey) {
                                    toast("AI API Key not configured.", "error")
                                    return
                                }

                                // Mock deck text since we don't have a full PDF extractor here yet
                                const mockDeckText = `Problem: Real estate market is inefficient. Solution: AI matching for properties. Market: $10B. Traction: 100 users. Team: Ex-Google founders.`
                                const review = await reviewPitchDeck(mockDeckText, apiKey)
                                setDeckReview(review)
                                toast("AI Feedback Generated", "success")
                            } catch (err) {
                                toast("Feedback failed", "error")
                            } finally {
                                setIsReviewing(false)
                            }
                        }}
                        disabled={isReviewing}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8"
                    >
                        {isReviewing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing Deck...
                            </>
                        ) : (
                            "Start AI Analysis"
                        )}
                        {!subscriptionManager.hasFeature('Pitch Deck') && (
                            <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">PRO</span>
                        )}
                    </Button>
                ) : (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Analysis Report</span>
                            <Button variant="ghost" size="sm" onClick={() => setDeckReview(null)} className="text-indigo-600">Retake</Button>
                        </div>
                        <div className="prose prose-sm max-w-none text-indigo-900 leading-relaxed whitespace-pre-line font-medium">
                            {deckReview}
                        </div>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Danger Zone</h3>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700/80 mt-1">Permanently remove your profile and all data. This action cannot be undone.</p>
                    </div>
                    <Button
                        onClick={() => setIsDeleteOpen(true)}
                        variant="ghost"
                        className="text-red-600 hover:bg-red-100 hover:text-red-700 font-bold whitespace-nowrap"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Profile
                    </Button>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                startup={startup}
                onSave={updateProfile}
                saving={saving}
            />

            <DeleteAccountModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
                expectedName={startup.name}
            />
        </div>
    )
}
