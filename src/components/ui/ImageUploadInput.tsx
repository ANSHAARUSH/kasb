import { useState, useRef } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Upload, Link as LinkIcon } from "lucide-react"
import { useToast } from "../../hooks/useToast"

interface ImageUploadInputProps {
    value: string
    onChange: (url: string) => void
    label: string
    placeholder?: string
}

export function ImageUploadInput({ value, onChange, label, placeholder }: ImageUploadInputProps) {
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const [mode, setMode] = useState<'url' | 'upload'>('url')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast("Please select an image file", "error")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast("Image must be less than 5MB", "error")
            return
        }

        setUploading(true)
        try {
            // Convert to base64 data URL
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                onChange(base64String)
                toast("Image loaded successfully!", "success")
                setUploading(false)
            }
            reader.onerror = () => {
                toast("Failed to load image", "error")
                setUploading(false)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Upload error:', error)
            toast("Failed to load image", "error")
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${mode === 'url'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <LinkIcon className="h-3 w-3 inline mr-1" />
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${mode === 'upload'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Upload className="h-3 w-3 inline mr-1" />
                    Upload
                </button>
            </div>

            {mode === 'url' ? (
                <Input
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder || "Enter image URL"}
                />
            ) : (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Loading...' : 'Choose Image'}
                    </Button>
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl flex items-center justify-center">
                        <div className="h-20 w-20 shrink-0 flex items-center justify-center rounded-xl bg-white overflow-hidden font-bold text-gray-500 ring-1 ring-gray-100 shadow-sm text-2xl">
                            {(value?.startsWith('http') || value?.startsWith('/') || value?.startsWith('data:')) ? (
                                <img
                                    src={value}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const parent = target.parentElement
                                        if (parent) {
                                            parent.innerText = '?'
                                        }
                                    }}
                                />
                            ) : (
                                <span>{value || '?'}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
