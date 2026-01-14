import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ImageUploadInput } from "../../../components/ui/ImageUploadInput"
import { Modal } from "../../../components/ui/modal"
import { useState, useEffect } from "react"
import type { InvestorProfileData } from "../../../hooks/useInvestorProfile"
import { COUNTRIES } from "../../../lib/locationData"
import { EXPERTISE_AREAS } from "../../../lib/constants"

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

    const toggleExpertise = (area: string) => {
        const current = editForm.expertise || []
        if (current.includes(area)) {
            setEditForm(prev => ({ ...prev, expertise: current.filter(a => a !== area) }))
        } else {
            setEditForm(prev => ({ ...prev, expertise: [...current, area] }))
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
                    <label className="text-sm font-medium">Location</label>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                            value={editForm.location?.split(', ')[1] || ''}
                            onChange={e => {
                                const country = e.target.value
                                const currentState = editForm.location?.split(', ')[0] || ''
                                setEditForm(prev => ({ ...prev, location: `${currentState}, ${country}` }))
                            }}
                        >
                            <option value="">Select Country...</option>
                            {COUNTRIES.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                            value={editForm.location?.split(', ')[0] || ''}
                            onChange={e => {
                                const state = e.target.value
                                const currentCountry = editForm.location?.split(', ')[1] || ''
                                setEditForm(prev => ({ ...prev, location: `${state}, ${currentCountry}` }))
                            }}
                            disabled={!editForm.location?.split(', ')[1]}
                        >
                            <option value="">Select State...</option>
                            {COUNTRIES.find(c => c.name === editForm.location?.split(', ')[1])?.states.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
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

                <div className="space-y-3">
                    <label className="text-sm font-medium">Areas of Expertise</label>
                    <div className="flex flex-wrap gap-2">
                        {EXPERTISE_AREAS.map((area) => (
                            <button
                                key={area}
                                type="button"
                                onClick={() => toggleExpertise(area)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${(editForm.expertise || []).includes(area)
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
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
