import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export function Login() {
    const navigate = useNavigate()
    const { user, role, loading: authLoading } = useAuth() // Use global auth state
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [needsVerification, setNeedsVerification] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    // Auto-redirect if already logged in (e.g. from email link)
    useEffect(() => {
        if (!authLoading && user && role) {
            console.log("User already authenticated, redirecting...")
            if (role === 'admin') navigate("/admin", { replace: true })
            else if (role === 'startup') navigate("/dashboard/startup", { replace: true })
            else if (role === 'investor') navigate("/dashboard/investor", { replace: true })
        }
    }, [user, role, authLoading, navigate])

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let interval: any
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [resendCooldown])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            if (user) {
                // Check for admin
                const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
                if (admin) {
                    navigate("/admin")
                    return
                }

                // Check role by querying tables
                const { data: startup } = await supabase.from('startups').select('id').eq('id', user.id).single()
                if (startup) {
                    navigate("/dashboard/startup")
                    return
                }

                const { data: investor } = await supabase.from('investors').select('id').eq('id', user.id).single()
                if (investor) {
                    navigate("/dashboard/investor")
                    return
                }

                // Fallback if no role found (maybe Admin or new user)
                alert("Login successful but no profile found. Please contact support.")
            }
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes("Email not confirmed")) {
                    setNeedsVerification(true)
                }
                alert(error.message)
            } else {
                alert("An unknown error occurred")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (resendCooldown > 0) return

        try {
            console.log("Attempting to resend verification to:", email)
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: window.location.origin
                }
            })
            if (error) throw error
            alert("Verification email sent! Please check your inbox (and spam folder).")
            setResendCooldown(60)
        } catch (error) {
            console.error("Resend error:", error)
            if (error instanceof Error) {
                alert(`Error sending email: ${error.message}`)
            } else {
                alert("Failed to send verification email. Please try again later.")
            }
        }
    }

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 border-2 border-black/5 hover:border-black">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-4xl font-extrabold tracking-tight">Log In</CardTitle>
                    <CardDescription className="text-gray-500 font-medium text-lg">
                        Welcome back! Please log in to your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                                <Link to="/forgot-password" className="text-sm font-medium text-gray-500 hover:text-gray-900">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
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
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" size="lg" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <p className="text-gray-500 font-medium">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-black font-black hover:underline underline-offset-4 decoration-2">
                                Sign up
                            </Link>
                        </p>
                        {needsVerification && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={handleResendVerification}
                                disabled={resendCooldown > 0}
                            >
                                {resendCooldown > 0
                                    ? `Resend available in ${resendCooldown}s`
                                    : "Resend Verification Email"
                                }
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
