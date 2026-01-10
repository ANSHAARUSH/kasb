import { Button } from "../../components/ui/button"
import { useState } from "react"
import { Pencil, Trash2, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { useInvestorProfile } from "../../hooks/useInvestorProfile"
// ... (rest of imports)
import { ProfileView } from "./investor/ProfileView"
import { EditProfileModal } from "./investor/EditProfileModal"
import { supabase } from "../../lib/supabase"
import { DeleteAccountModal } from "../../components/dashboard/DeleteAccountModal"
import { useAuth } from "../../context/AuthContext"

export function InvestorProfile() {
    const { signOut } = useAuth()
    const {
        investor,
        loading,
        saving,
        updateProfile,
        requestReview,
    } = useInvestorProfile()

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const handleDeleteAccount = async () => {
        try {
            const { error } = await supabase.rpc('delete_user_account')
            if (error) throw error
            await signOut()
            window.location.href = '/'
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unknown error occurred"
            alert("Error deleting account: " + message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    if (!investor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h3>
                <p className="text-gray-500 max-w-md mb-6">
                    We couldn't load your investor profile. This usually happens if the account setup wasn't completed properly.
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
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Investor Profile</h2>
                    <p className="text-gray-500 text-sm sm:text-base">Manage your investment preferences and public profile</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link to="/dashboard/pricing">
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold border-gray-200 gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                            <Zap className="h-4 w-4 fill-indigo-600" />
                            Manage Plan
                        </Button>
                    </Link>
                    <Button
                        onClick={() => signOut()}
                        variant="outline"
                        className="rounded-xl font-bold border-gray-200"
                    >
                        Sign Out
                    </Button>
                    <Button
                        onClick={() => setIsEditOpen(true)}
                        className="bg-black text-white hover:bg-gray-800 rounded-xl font-bold"
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            <ProfileView investor={investor} onRequestReview={requestReview} />

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
                investor={investor}
                onSave={updateProfile}
                saving={saving}
            />

            <DeleteAccountModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
                expectedName={investor.name}
            />
        </div>
    )
}
