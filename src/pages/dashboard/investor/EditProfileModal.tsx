import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ImageUploadInput } from "../../../components/ui/ImageUploadInput"
import { Modal } from "../../../components/ui/modal"
import { useState, useEffect } from "react"
import type { InvestorProfileData, InvestorProfileDetails } from "../../../hooks/useInvestorProfile"
import { COUNTRIES } from "../../../lib/locationData"
import { EXPERTISE_AREAS } from "../../../lib/constants"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    investor: InvestorProfileData
    onSave: (data: Partial<InvestorProfileData>) => Promise<boolean>
    saving: boolean
}

const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'decision', label: 'Decision Style' },
    { id: 'value', label: 'Value Add' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'communication', label: 'Communication' },
    { id: 'social', label: 'Social Proof' },
]

export function EditProfileModal({ isOpen, onClose, investor, onSave, saving }: EditProfileModalProps) {
    const [activeTab, setActiveTab] = useState('basic')
    const [editForm, setEditForm] = useState<Partial<InvestorProfileData>>({})

    useEffect(() => {
        if (isOpen) {
            setEditForm(JSON.parse(JSON.stringify(investor))) // Deep copy to handle nested objects
        }
    }, [isOpen, investor])

    const handleSave = async () => {
        const success = await onSave(editForm)
        if (success) {
            onClose()
        }
    }

    const updateProfileDetails = (
        section: keyof InvestorProfileDetails,
        field: string,
        value: any
    ) => {
        setEditForm(prev => ({
            ...prev,
            profile_details: {
                ...prev.profile_details,
                [section]: {
                    ...prev.profile_details?.[section],
                    [field]: value
                }
            }
        }))
    }

    const toggleArrayItem = (
        section: keyof InvestorProfileDetails,
        field: string,
        item: string
    ) => {
        const currentDetails = editForm.profile_details?.[section] as any || {}
        const currentArray = currentDetails[field] || []
        const newArray = currentArray.includes(item)
            ? currentArray.filter((i: string) => i !== item)
            : [...currentArray, item]

        updateProfileDetails(section, field, newArray)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Investor Profile" className="max-w-4xl">
            <div className="flex flex-col h-[70vh]">
                {/* Tabs */}
                <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto mb-4 shrink-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'bg-black text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">

                    {/* BASIC INFO */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <Input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={editForm.title || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Angel Investor"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
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
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
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
                                <label className="text-sm font-medium">Bio</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
                        </div>
                    )}

                    {/* INVESTMENT PREFERENCES */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Investment Stage</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'].map(stage => (
                                        <button
                                            key={stage}
                                            onClick={() => toggleArrayItem('investment_preferences', 'stage', stage)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${editForm.profile_details?.investment_preferences?.stage?.includes(stage)
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-600 border-gray-200'
                                                }`}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Min Ticket Size</label>
                                    <Input
                                        type="number"
                                        value={editForm.profile_details?.investment_preferences?.ticket_size_min || ''}
                                        onChange={e => updateProfileDetails('investment_preferences', 'ticket_size_min', Number(e.target.value))}
                                        placeholder="e.g. 10000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Ticket Size</label>
                                    <Input
                                        type="number"
                                        value={editForm.profile_details?.investment_preferences?.ticket_size_max || ''}
                                        onChange={e => updateProfileDetails('investment_preferences', 'ticket_size_max', Number(e.target.value))}
                                        placeholder="e.g. 500000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Funds Available (Display)</label>
                                <Input
                                    value={editForm.funds_available || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, funds_available: e.target.value }))}
                                    placeholder="e.g. $2M"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Industry Focus</label>
                                <div className="flex flex-wrap gap-2">
                                    {['FinTech', 'HealthTech', 'SaaS', 'AI', 'D2C', 'Climate', 'EduTech', 'PropTech', 'DeepTech', 'AgriTech'].map(ind => (
                                        <button
                                            key={ind}
                                            onClick={() => toggleArrayItem('investment_preferences', 'industry_focus', ind)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${editForm.profile_details?.investment_preferences?.industry_focus?.includes(ind)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-200'
                                                }`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Business Model Preference</label>
                                <div className="flex gap-2">
                                    {['B2B', 'B2C', 'B2B2C'].map(model => (
                                        <button
                                            key={model}
                                            onClick={() => toggleArrayItem('investment_preferences', 'business_model', model)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border ${editForm.profile_details?.investment_preferences?.business_model?.includes(model)
                                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                                : 'bg-white border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Revenue Preference</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                    value={editForm.profile_details?.investment_preferences?.revenue_preference || ''}
                                    onChange={e => updateProfileDetails('investment_preferences', 'revenue_preference', e.target.value)}
                                >
                                    <option value="">Any</option>
                                    <option value="Pre-revenue">Pre-revenue</option>
                                    <option value="Revenue-generating">Revenue-generating only</option>
                                    <option value="Profitable">Profitable</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* DECISION STYLE */}
                    {activeTab === 'decision' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Decision Speed</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Fast (1-2 weeks)', 'Moderate', 'Long-term'].map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => updateProfileDetails('decision_process', 'speed', speed)}
                                            className={`p-3 rounded-xl border text-sm font-medium ${editForm.profile_details?.decision_process?.speed === speed
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {speed}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Due Diligence Depth</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Light', 'Standard', 'Deep'].map(depth => (
                                        <button
                                            key={depth}
                                            onClick={() => updateProfileDetails('decision_process', 'due_diligence', depth)}
                                            className={`p-3 rounded-xl border text-sm font-medium ${editForm.profile_details?.decision_process?.due_diligence === depth
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {depth}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Hands-on Level</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Mentor', 'Board Member', 'Strategic Advisor', 'Passive Investor'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => updateProfileDetails('decision_process', 'hands_on_level', level)}
                                            className={`p-3 rounded-xl border text-sm font-medium ${editForm.profile_details?.decision_process?.hands_on_level === level
                                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="follow_on"
                                    checked={editForm.profile_details?.decision_process?.follow_on || false}
                                    onChange={e => updateProfileDetails('decision_process', 'follow_on', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="follow_on" className="text-sm font-medium">Interested in Follow-on Investments</label>
                            </div>
                        </div>
                    )}

                    {/* VALUE ADD */}
                    {activeTab === 'value' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Areas of Expertise</label>
                                <div className="flex flex-wrap gap-2">
                                    {EXPERTISE_AREAS.map(area => (
                                        <button
                                            key={area}
                                            onClick={() => {
                                                // Sync both arrays for backward compatibility
                                                toggleArrayItem('value_add', 'expertise', area)

                                                const currentRoot = editForm.expertise || []
                                                const newRoot = currentRoot.includes(area)
                                                    ? currentRoot.filter(a => a !== area)
                                                    : [...currentRoot, area]
                                                setEditForm(prev => ({ ...prev, expertise: newRoot }))
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${editForm.profile_details?.value_add?.expertise?.includes(area)
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-600 border-gray-200'
                                                }`}
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Network Access</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Enterprise Clients', 'Other Investors', 'Talent Pool', 'Govt / Regulatory'].map(net => (
                                        <button
                                            key={net}
                                            onClick={() => toggleArrayItem('value_add', 'network', net)}
                                            className={`p-3 rounded-xl border text-sm font-medium text-left ${editForm.profile_details?.value_add?.network?.includes(net)
                                                ? 'bg-gray-100 border-gray-400'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {net}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Past Exits involved in</label>
                                    <Input
                                        type="number"
                                        value={editForm.profile_details?.value_add?.exits_count || ''}
                                        onChange={e => updateProfileDetails('value_add', 'exits_count', Number(e.target.value))}
                                    />
                                </div>
                                <div className="flex items-center pt-8">
                                    <input
                                        type="checkbox"
                                        id="founder_xp"
                                        checked={editForm.profile_details?.value_add?.has_founder_experience || false}
                                        onChange={e => updateProfileDetails('value_add', 'has_founder_experience', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 mr-2"
                                    />
                                    <label htmlFor="founder_xp" className="text-sm font-medium">I have Founder Experience</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PORTFOLIO */}
                    {activeTab === 'portfolio' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Active Investments</label>
                                    <Input
                                        type="number"
                                        value={editForm.profile_details?.portfolio?.active_count || ''}
                                        onChange={e => updateProfileDetails('portfolio', 'active_count', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Exited Investments</label>
                                    <Input
                                        type="number"
                                        value={editForm.profile_details?.portfolio?.exited_count || ''}
                                        onChange={e => updateProfileDetails('portfolio', 'exited_count', Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Average Check Size</label>
                                <Input
                                    type="number"
                                    value={editForm.profile_details?.portfolio?.average_check_size || ''}
                                    onChange={e => updateProfileDetails('portfolio', 'average_check_size', Number(e.target.value))}
                                    placeholder="$"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notable Investments (Comma separated)</label>
                                <Input
                                    value={editForm.profile_details?.portfolio?.notable_investments?.join(', ') || ''}
                                    onChange={e => updateProfileDetails('portfolio', 'notable_investments', e.target.value.split(',').map(s => s.trim()))}
                                    placeholder="e.g. Uber, Airbnb, Stripe"
                                />
                            </div>
                        </div>
                    )}

                    {/* COMMUNICATION */}
                    {activeTab === 'communication' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Preferred Pitch Format</label>
                                <div className="flex gap-2">
                                    {['Deck', 'One-pager', 'Video pitch'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => toggleArrayItem('communication', 'pitch_format', fmt)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border ${editForm.profile_details?.communication?.pitch_format?.includes(fmt)
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Preferred Contact Mode</label>
                                <div className="flex gap-2">
                                    {['Platform Chat', 'Email', 'Intro Only'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => toggleArrayItem('communication', 'contact_mode', mode)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border ${editForm.profile_details?.communication?.contact_mode?.includes(mode)
                                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                                : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Typical Response Time</label>
                                <Input
                                    value={editForm.profile_details?.communication?.response_time || ''}
                                    onChange={e => updateProfileDetails('communication', 'response_time', e.target.value)}
                                    placeholder="e.g. 3-5 days"
                                />
                            </div>
                        </div>
                    )}

                    {/* SOCIAL PROOF */}
                    {activeTab === 'social' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Investor Type</label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                    value={editForm.profile_details?.social_proof?.investor_type || ''}
                                    onChange={e => updateProfileDetails('social_proof', 'investor_type', e.target.value)}
                                >
                                    <option value="">Select Type...</option>
                                    <option value="Angel">Angel Investor</option>
                                    <option value="VC">VC</option>
                                    <option value="Family Office">Family Office</option>
                                    <option value="Corporate VC">Corporate VC</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">LinkedIn Profile URL</label>
                                <Input
                                    value={editForm.profile_details?.social_proof?.linkedin || ''}
                                    onChange={e => updateProfileDetails('social_proof', 'linkedin', e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website / Fund Page</label>
                                <Input
                                    value={editForm.profile_details?.social_proof?.website || ''}
                                    onChange={e => updateProfileDetails('social_proof', 'website', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t pt-4 mt-auto">
                    <Button className="w-full" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving Changes..." : "Save Profile"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
