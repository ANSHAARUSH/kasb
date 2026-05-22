import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Switch } from "../../components/ui/switch"
import { Label } from "../../components/ui/label"
import { Save } from "lucide-react"

interface ConfigItem {
    key: string
    value: string
    description: string
}

export function AdminSettings() {
    // Existing Config State
    const [configs, setConfigs] = useState<ConfigItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // AI Config State
    const [apiKey, setApiKey] = useState("")
    const [testing, setTesting] = useState(false)
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [testMessage, setTestMessage] = useState("")

    useEffect(() => {
        fetchConfigs()
        const storedKey = localStorage.getItem('groq_api_key')
        if (storedKey) setApiKey(storedKey)
    }, [])

    const saveApiKey = () => {
        if (!apiKey.trim()) {
            localStorage.removeItem('groq_api_key')
            alert("API Key removed from browser storage.")
        } else {
            localStorage.setItem('groq_api_key', apiKey.trim())
            alert("API Key saved to browser storage.")
        }
    }

    const handleTestAI = async () => {
        setTesting(true)
        setTestStatus('idle')
        setTestMessage("")

        try {
            const keyToUse = apiKey || import.meta.env.VITE_GROQ_API_KEY
            if (!keyToUse) throw new Error("No API Key available to test.")

            // Import dynamically or use the function if available in scope. 
            // Since we are in pages/..., we can import from lib.
            // We need to add the import statement at the top of the file separately.
            const { chatWithAI } = await import("../../lib/ai")

            const response = await chatWithAI("Hello, are you online?", [], keyToUse)
            if (response) {
                setTestStatus('success')
                setTestMessage(`Success! AI replied: "${response.substring(0, 50)}..."`)
            } else {
                throw new Error("Empty response from AI")
            }
        } catch (err: any) {
            console.error("AI Test Error:", err)
            setTestStatus('error')
            setTestMessage("Error: " + (err.message || String(err)))
        } finally {
            setTesting(false)
        }
    }

    const fetchConfigs = async () => {
        const { data, error } = await supabase
            .from('global_config')
            .select('*')
            .order('key')

        if (data) setConfigs(data)
        if (error) console.error("Error fetching configs:", error)
        setLoading(false)
    }

    const handleChange = (key: string, newValue: string) => {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Upsert all configs
            const { error } = await supabase
                .from('global_config')
                .upsert(configs.map(c => ({
                    key: c.key,
                    value: c.value,
                    description: c.description,
                    updated_at: new Date().toISOString()
                })))

            if (error) throw error
            alert("Settings saved successfully!")
        } catch (err: any) {
            alert("Error saving settings: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>Loading settings...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
                    <p className="text-gray-500">Manage global limits and feature flags.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-gray-800">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Freemium Limits</CardTitle>
                        <CardDescription>Control what free users can do.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {configs.filter(c => c.key.includes('limit')).map(config => (
                            <div key={config.key} className="flex flex-col gap-2">
                                <Label htmlFor={config.key} className="font-bold">{config.key.replace(/_/g, ' ').toUpperCase()}</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id={config.key}
                                        value={config.value}
                                        onChange={e => handleChange(config.key, e.target.value)}
                                        className="max-w-xs"
                                        type="number"
                                    />
                                    <span className="text-sm text-gray-500">{config.description}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags</CardTitle>
                        <CardDescription>Toggle system-wide features.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {configs.filter(c => c.key.includes('enable')).map(config => (
                            <div key={config.key} className="flex items-center justify-between p-4 border rounded-xl">
                                <div>
                                    <Label htmlFor={config.key} className="font-bold block">{config.key.replace(/_/g, ' ').toUpperCase()}</Label>
                                    <span className="text-sm text-gray-500">{config.description}</span>
                                </div>
                                <Switch
                                    id={config.key}
                                    checked={config.value === 'true'}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(config.key, String(e.target.checked))}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Configuration</CardTitle>
                        <CardDescription>Manage AI settings and test connection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Groq API Key</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder={import.meta.env.VITE_GROQ_API_KEY ? "Using ENV Variable (Hidden)" : "Enter API Key"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <Button onClick={saveApiKey} variant="outline">Save to Browser</Button>
                            </div>
                            <p className="text-xs text-gray-400">
                                Current Data Source: {apiKey ? "Custom (Browser)" : (import.meta.env.VITE_GROQ_API_KEY ? "Environment Variable" : "Missing")}
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleTestAI}
                                disabled={testing}
                                variant={testStatus === 'success' ? 'default' : (testStatus === 'error' ? 'destructive' : 'secondary')}
                                className="w-full"
                            >
                                {testing ? "Testing..." : (testStatus === 'success' ? "Connection Verified ✅" : (testStatus === 'error' ? "Connection Failed ❌" : "Test AI Connection"))}
                            </Button>
                            {testMessage && (
                                <p className={`text-sm mt-2 ${testStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                    {testMessage}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
