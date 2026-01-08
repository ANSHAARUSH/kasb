import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Link } from "react-router-dom"
import { cn } from "../../lib/utils"
import { supabase } from "../../lib/supabase"
import { Mail, ArrowRight, Eye, EyeOff } from "lucide-react"
import { StartupFields } from "./signup/StartupFields"
import { InvestorFields } from "./signup/InvestorFields"
import { refineProblemStatement } from "../../lib/ai"
import { getGlobalConfig } from "../../lib/supabase"
import { useToast } from "../../hooks/useToast"

const INDUSTRIES = [
    'AI/ML',
    'SaaS',
    'FinTech',
    'HealthTech',
    'EdTech',
    'AgriTech',
    'CleanTech',
    'ClimateTech',
    'Manufacturing',
    'E-commerce',
    'Media & Gaming',
    'PropTech',
    'LogisticTech',
    'Others'
] as const

const EXPERTISE_AREAS = [
    'SaaS',
    'FinTech',
    'HealthTech',
    'AI/ML',
    'E-commerce',
    'Enterprise',
    'Consumer',
    'Others'
] as const

export function SignUp() {
    const { toast } = useToast()
    const [role, setRole] = useState<'investor' | 'startup'>('startup')
    const [selectedIndustry, setSelectedIndustry] = useState<string>('')
    const [customIndustry, setCustomIndustry] = useState<string>('')
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
    const [customExpertise, setCustomExpertise] = useState<string>('')

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
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
                toast("AI API Key not configured.", "error")
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

                metadata.name = name
                metadata.founded_name = name // align with trigger expectation
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
                    emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
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
                                        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
                                    }
                                })
                                if (error) setError(error.message)
                                else setResendCooldown(60)
                            }}
                        >
                            {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
                        </Button>
                        <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-black transition-colors underline decoration-2 underline-offset-4">
                            Back to sign in
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

                <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-gray-100">
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
                        </form>
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex justify-center border-t border-gray-50 bg-gray-50/20">
                        <p className="text-gray-500 font-medium">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="text-black font-black hover:underline underline-offset-4 decoration-2"
                            >
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
