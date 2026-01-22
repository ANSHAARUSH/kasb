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
    const { user, role, loading: authLoading, signInWithGoogle } = useAuth() // Use global auth state
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [needsVerification, setNeedsVerification] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            console.log("[Login] User authenticated, moving to dashboard")
            if (role === 'admin') navigate("/admin", { replace: true })
            else if (role === 'startup') navigate("/dashboard/startup", { replace: true })
            else if (role === 'investor') navigate("/dashboard/investor", { replace: true })
            else navigate("/dashboard", { replace: true })
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

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        try {
            const baseUrl = window.location.origin + window.location.pathname
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
            await signInWithGoogle(cleanBaseUrl)
        } catch (err: any) {
            alert(err.message || "Google login failed")
            setGoogleLoading(false)
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
                        <Button className="w-full" size="lg" type="submit" disabled={loading || googleLoading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-bold">
                                <span className="bg-white px-2 text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-2 border-black/5 hover:border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold h-12"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                        >
                            {googleLoading ? (
                                "Connecting..."
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Log in with Google
                                </span>
                            )}
                        </Button>

                        <p className="text-gray-500 font-medium text-center">
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
