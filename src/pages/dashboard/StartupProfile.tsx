import { Button } from "../../components/ui/button"
import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useStartupProfile } from "../../hooks/useStartupProfile"
import { ProfileView } from "./startup/ProfileView"
import { EditProfileModal } from "./startup/EditProfileModal"
import { DeleteAccountModal } from "../../components/dashboard/DeleteAccountModal"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"

export function StartupProfile() {
    const { startup, loading, saving, updateProfile, requestReview, markAsLive } = useStartupProfile()
    const { signOut } = useAuth()
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
            <div className="p-12 text-center text-gray-500 font-medium">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-3xl" />
                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-200 rounded-md" />
                </div>
            </div>
        )
    }

    if (!startup) return null

    return (
        <div className="pb-24 max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Profile</h1>
                    <p className="text-gray-400 mt-1 font-medium">Manage your startup identity</p>
                </div>
                <Button
                    onClick={() => setIsEditOpen(true)}
                    variant="outline"
                    className="rounded-2xl gap-2 hover:bg-black hover:text-white transition-all border-gray-200"
                >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                </Button>
            </div>

            <ProfileView startup={startup} onRequestReview={requestReview} onMarkAsLive={markAsLive} />

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
