import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ImageUploadInput } from "../../../components/ui/ImageUploadInput"
import { Modal } from "../../../components/ui/modal"
import { useState, useEffect } from "react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    investor: InvestorProfileData
    onSave: (data: Partial<InvestorProfileData>) => Promise<boolean>
    saving: boolean
}

export function EditProfileModal({ isOpen, onClose, investor, onSave, saving }: EditProfileModalProps) {
    const [editForm, setEditForm] = useState<Partial<InvestorProfileData>>({})

    useEffect(() => {
        if (isOpen) {
            queueMicrotask(() => {
                setEditForm(investor)
            })
        }
    }, [isOpen, investor])

    const handleSave = async () => {
        const success = await onSave(editForm)
        if (success) {
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                        value={editForm.name || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Investor Title (e.g. Angel Investor)</label>
                    <Input
                        value={editForm.title || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Funds Available</label>
                    <Input
                        value={editForm.funds_available || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, funds_available: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Portfolio Size (Companies)</label>
                    <Input
                        type="number"
                        value={editForm.investments_count || 0}
                        onChange={e => setEditForm(prev => ({ ...prev, investments_count: parseInt(e.target.value) || 0 }))}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                        value={editForm.bio || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    />
                </div>

                <ImageUploadInput
                    label="Avatar"
                    value={editForm.avatar || ''}
                    onChange={url => setEditForm(prev => ({ ...prev, avatar: url }))}
                    placeholder="Enter avatar URL or upload image"
                />

                <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </Modal>
    )
}
