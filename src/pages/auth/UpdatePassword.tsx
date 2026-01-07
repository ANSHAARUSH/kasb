import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function UpdatePassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(true)

    useEffect(() => {
        // Verify we have a session (the link should sign the user in automatically)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // If no session, they might have lost it or the link is invalid/expired
                // But typically supabase handles the exchange on load.
                // We'll give it a moment or check if there's an error fragment
                // But for now, let's redirect to login if no session after a small wait or check
                // Actually, the recovery link logs them in.

                // Let's rely on the AuthGuard usually, but here we want to handle it specifically for this page flow
            }
            setVerifying(false)
        }
        checkSession()
    }, [])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            alert("Password updated successfully! Redirecting to login...")
            await supabase.auth.signOut() // Force sign out to make them login with new password or just redirect
            navigate("/login")
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("An error occurred. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                    <CardDescription>
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                    placeholder="••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
