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
    const [configs, setConfigs] = useState<ConfigItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchConfigs()
    }, [])

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
            </div>
        </div>
    )
}
