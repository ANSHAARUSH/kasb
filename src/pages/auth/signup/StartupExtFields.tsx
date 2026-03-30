import { Input } from "../../../components/ui/input"
import { STANDARD_QUESTIONNAIRE } from "../../../lib/questionnaires/ideation"

interface StartupExtFieldsProps {
    questionnaire: Record<string, Record<string, string>>
    setQuestionnaire: (val: Record<string, Record<string, string>>) => void
}

export function StartupExtFields({ questionnaire, setQuestionnaire }: StartupExtFieldsProps) {
    const handleChange = (sectionId: string, questionId: string, value: string) => {
        setQuestionnaire({
            ...questionnaire,
            [sectionId]: {
                ...(questionnaire[sectionId] || {}),
                [questionId]: value
            }
        })
    }

    return (
        <div className="space-y-6 mt-6 pt-6 border-t border-gray-100">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Deep Dive (Optional)</h3>
                <p className="text-sm text-gray-500">
                    Auto-filled from your pitch deck. You can edit these details now or later in your profile. Provide as much detail as you'd like.
                </p>
            </div>

            {STANDARD_QUESTIONNAIRE.map((section) => (
                <div key={section.id} className="space-y-4">
                    {section.title && <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{section.title}</h4>}
                    {section.questions.map((q) => {
                        // Skip problem_statement as it's already in the main form (problemSolving)
                        if (q.id === 'problem_statement') return null;
                        
                        const value = questionnaire[section.id]?.[q.id] || ""
                        
                        return (
                            <div key={q.id} className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex justify-between">
                                    <span>{q.label}</span>
                                    {!q.required && <span className="text-xs text-gray-400">Optional</span>}
                                </label>
                                {q.type === 'textarea' ? (
                                    <textarea
                                        rows={3}
                                        placeholder={q.placeholder}
                                        value={value}
                                        onChange={(e) => handleChange(section.id, q.id, e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                ) : (
                                    <Input
                                        placeholder={q.placeholder}
                                        value={value}
                                        onChange={(e) => handleChange(section.id, q.id, e.target.value)}
                                        className="h-12 rounded-xl focus:ring-black"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
