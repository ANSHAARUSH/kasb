import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Sparkles, Key, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getUserSetting, saveUserSetting } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"

export function AISettings() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [apiKey, setApiKey] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasKey, setHasKey] = useState(false)

    useEffect(() => {
        if (!user) return

        async function loadKey() {
            try {
                const key = await getUserSetting(user!.id, 'ai_api_key')
                if (key) {
                    setApiKey(key)
                    setHasKey(true)
                }
            } catch (err) {
                console.error("Error loading AI key:", err)
            } finally {
                setIsLoading(false)
            }
        }
        loadKey()
    }, [user])

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            await saveUserSetting(user.id, 'ai_api_key', apiKey)
            setHasKey(!!apiKey)
            toast(apiKey ? "AI API Key saved successfully" : "AI API Key removed", "success")
        } catch (err) {
            console.error("Error saving AI key:", err)
            toast("Failed to save API Key", "error")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-[2rem] border border-gray-100">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <Card className="rounded-[2rem] border-0 ring-1 ring-gray-100 overflow-hidden bg-white shadow-sm mt-8">
            <CardHeader className="bg-indigo-50/50 p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">AI Configuration</CardTitle>
                        <CardDescription>Personalize your AI experience with your own API key</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-2">
                    {hasKey ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <p className="text-sm font-medium text-gray-600">
                        {hasKey
                            ? "Connected: Using your personalized API key for all AI analyses."
                            : "Demo Mode: Currently using mock data. Add a key to enable real-time analysis."}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700 ml-1">Groq/OpenAI API Key</label>
                        <a
                            href="https://console.groq.com/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] uppercase tracking-widest font-black text-indigo-600 hover:text-indigo-700"
                        >
                            Get Groq Key
                        </a>
                    </div>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="password"
                            placeholder="gsk_..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="pl-10 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-colors"
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 ml-1">
                        Your key is stored securely and never shared. We recommend using a limited-access key.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl bg-black text-white font-bold hover:scale-[1.01] transition-transform"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving Configuration...
                        </>
                    ) : (
                        "Save AI Configuration"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
