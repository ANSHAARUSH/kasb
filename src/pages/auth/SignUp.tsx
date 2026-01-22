import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "../../lib/utils"
import { supabase } from "../../lib/supabase"
import { Mail, ArrowRight, Eye, EyeOff } from "lucide-react"
import { StartupFields } from "./signup/StartupFields"
import { InvestorFields } from "./signup/InvestorFields"
import { refineProblemStatement } from "../../lib/ai"
import { getGlobalConfig } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"
import { INDUSTRIES, EXPERTISE_AREAS, APP_URL } from "../../lib/constants"
import { useAuth } from "../../context/AuthContext"


export function SignUp() {
    const { toast } = useToast()
    const [role, setRole] = useState<'investor' | 'startup'>('startup')
    const [selectedIndustry, setSelectedIndustry] = useState<string>('')
    const [customIndustry, setCustomIndustry] = useState<string>('')
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
    const [customExpertise, setCustomExpertise] = useState<string>('')

    const [error, setError] = useState<string | null>(null)
    const { user, loading: authLoading, signInWithGoogle } = useAuth()
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const navigate = useNavigate()

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            console.log("[SignUp] User authenticated, moving to dashboard")
            navigate('/dashboard', { replace: true })
        }
    }, [user, authLoading, navigate])

    const [verificationSent, setVerificationSent] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(60)

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined
        if (verificationSent && resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [verificationSent, resendCooldown])

    // Form States
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Startup Specific
    const [companyName, setCompanyName] = useState('')
    const [problemSolving, setProblemSolving] = useState('')
    const [isRefining, setIsRefining] = useState(false)

    const handleRefineProblem = async () => {
        if (!problemSolving.trim()) return
        setIsRefining(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) {
                apiKey = await getGlobalConfig('ai_api_key') || ''
            }

            if (!apiKey) {
                toast("AI features are not setup. Please contact the administrator.", "error")
                return
            }

            const refined = await refineProblemStatement(problemSolving, apiKey)
            setProblemSolving(refined)
            toast("Problem statement refined!", "success")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Error refining problem"
            toast(message, "error")
        } finally {
            setIsRefining(false)
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Prepare metadata
            const metadata: Record<string, any> = {
                role: role,
            }

            if (role === 'startup') {
                const stageVal = (document.getElementById('stage') as HTMLSelectElement)?.value
                const teamSizeVal = (document.getElementById('teamSize') as HTMLInputElement)?.value
                metadata.company_name = companyName
                metadata.founder_name = name
                metadata.industry = selectedIndustry === 'Others' ? customIndustry : selectedIndustry
                metadata.stage = stageVal
                metadata.traction = teamSizeVal ? `${teamSizeVal} employees` : ''
                metadata.problem_solving = problemSolving
            } else {
                const investorTypeVal = (document.getElementById('investorType') as HTMLSelectElement)?.value
                const investmentRangeVal = (document.getElementById('investmentRange') as HTMLInputElement)?.value
                const investorBioVal = (document.getElementById('investorBio') as HTMLTextAreaElement)?.value

                metadata.name = name // align with trigger expectation
                metadata.investor_type = investorTypeVal
                metadata.funds_available = investmentRangeVal
                metadata.bio = investorBioVal
                // Expertise (array) - passed as metadata, handled if trigger supports it or user edits later
                metadata.expertise = selectedExpertise.includes('Others')
                    ? [...selectedExpertise.filter(e => e !== 'Others'), customExpertise]
                    : selectedExpertise
            }

            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: APP_URL,
                    data: metadata
                }
            })

            if (authError) throw authError
            if (!user) throw new Error("No user returned from signup")

            // Success - Trigger handles the DB insert
            setVerificationSent(true)
        } catch (err: any) {
            console.error("Signup Error:", err)
            // Improved error extraction
            const message = err?.message || JSON.stringify(err) || 'An unknown error occurred'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true)
        try {
            // Store role for retrieval after redirect
            localStorage.setItem('kasb_pending_role', role)
            const baseUrl = window.location.origin + window.location.pathname
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
            await signInWithGoogle(cleanBaseUrl)
        } catch (err: any) {
            setError(err.message || "Google signup failed")
            setGoogleLoading(false)
        }
    }

    if (verificationSent) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-2xl rounded-[2.5rem] bg-white text-center p-4">
                    <CardHeader className="pt-8 mb-4">
                        <div className="h-20 w-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                            <Mail className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight">Check your email</CardTitle>
                        <CardDescription className="text-gray-500 font-medium mt-2">
                            We've sent a verification link to <span className="text-black font-bold underline">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 mb-4">
                                {error}
                            </div>
                        )}
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 italic text-gray-600 text-sm">
                            "Transparency and verification are the cornerstones of successful partnerships."
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button
                            variant="outline"
                            className="w-full rounded-2xl h-12 font-bold border-gray-200"
                            disabled={resendCooldown > 0}
                            onClick={async () => {
                                const { error } = await supabase.auth.resend({
                                    type: 'signup',
                                    email,
                                    options: {
                                        emailRedirectTo: APP_URL
                                    }
                                })
                                if (error) setError(error.message)
                                else setResendCooldown(60)
                            }}
                        >
                            {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                        </Button>
                        <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-black transition-colors underline decoration-2 underline-offset-4">
                            Back to log in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block text-2xl font-black tracking-tighter hover:scale-105 transition-transform">
                        KASB.AI
                    </Link>
                </div>

                <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-gray-100 transition-all duration-300 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:ring-2 hover:ring-black">
                    <CardHeader className="p-8 pb-4 text-center">
                        <CardTitle className="text-4xl font-extrabold tracking-tight">Create Account</CardTitle>
                        <CardDescription className="text-gray-500 font-medium text-lg">
                            Empowering the next generation of founders
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-4">
                        <div className="flex bg-gray-50 p-1 rounded-2xl mb-8 relative">
                            <motion.div
                                className="absolute h-[calc(100%-8px)] rounded-xl bg-white shadow-lg z-0"
                                initial={false}
                                animate={{
                                    left: role === 'startup' ? '4px' : '50%',
                                    width: 'calc(50% - 4px)'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setRole('startup')}
                                className={cn(
                                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 relative z-10",
                                    role === 'startup' ? "text-black" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                startup
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('investor')}
                                className={cn(
                                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 relative z-10",
                                    role === 'investor' ? "text-black" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                investor
                            </button>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-6">
                            {error && (
                                <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <Input
                                        required
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 rounded-xl border-gray-100 focus:ring-black"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 rounded-xl border-gray-100 focus:ring-black"
                                    />
                                </div>
                                <div className="space-y-1 relative">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <div className="relative">
                                        <Input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-12 rounded-xl border-gray-100 focus:ring-black pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    {role === 'startup' ? (
                                        <StartupFields
                                            companyName={companyName}
                                            setCompanyName={setCompanyName}
                                            industries={INDUSTRIES}
                                            selectedIndustry={selectedIndustry}
                                            setSelectedIndustry={setSelectedIndustry}
                                            customIndustry={customIndustry}
                                            setCustomIndustry={setCustomIndustry}
                                            problemSolving={problemSolving}
                                            setProblemSolving={setProblemSolving}
                                            isRefining={isRefining}
                                            onRefine={handleRefineProblem}
                                        />
                                    ) : (
                                        <InvestorFields
                                            expertiseAreas={EXPERTISE_AREAS}
                                            selectedExpertise={selectedExpertise}
                                            setSelectedExpertise={setSelectedExpertise}
                                            customExpertise={customExpertise}
                                            setCustomExpertise={setCustomExpertise}
                                        />
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white hover:bg-gray-800 rounded-2xl h-14 text-base font-bold shadow-xl transition-all active:scale-[0.98] group mt-8"
                            >
                                {loading ? "Creating account..." : (
                                    <span className="flex items-center gap-2">
                                        Sign up now
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                    <span className="bg-white px-2">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-1 border-gray-100 hover:border-black transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl h-14 font-bold"
                                onClick={handleGoogleSignUp}
                                disabled={loading || googleLoading}
                            >
                                {googleLoading ? (
                                    "Connecting..."
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                                        Sign up with Google
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex justify-center border-t border-gray-50 bg-gray-50/20">
                        <p className="text-gray-500 font-medium">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="text-black font-black hover:underline underline-offset-4 decoration-2"
                            >
                                Log in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
