import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useNavigate } from "react-router-dom"
import { cn } from "../../lib/utils"
import { supabase } from "../../lib/supabase"
import { ArrowLeft, Rocket, Briefcase, CheckCircle2 } from "lucide-react"
import { StartupFields } from "./signup/StartupFields"
import { InvestorFields } from "./signup/InvestorFields"
import { INDUSTRIES, EXPERTISE_AREAS } from "../../lib/constants"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { refineProblemStatement } from "../../lib/ai"
import { getGlobalConfig } from "../../lib/supabase"

export function Onboarding() {
    const { user, role: authRole, loading: authLoading, refreshUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState(1) // 1: Role Selection, 2: Details
    const [role, setRole] = useState<'investor' | 'startup' | null>(null)
    const [loading, setLoading] = useState(false)

    // Shared Fields
    const [name, setName] = useState("")

    // Startup Specific
    const [companyName, setCompanyName] = useState('')
    const [selectedIndustry, setSelectedIndustry] = useState<string>('')
    const [customIndustry, setCustomIndustry] = useState<string>('')
    const [problemSolving, setProblemSolving] = useState('')
    const [isRefining, setIsRefining] = useState(false)

    // Investor Specific
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
    const [customExpertise, setCustomExpertise] = useState<string>('')

    // Auto-redirect if already has a role
    useEffect(() => {
        if (!authLoading && user && authRole) {
            console.log("[Onboarding] User already has a role, moving to dashboard")
            navigate('/dashboard', { replace: true })
        }
    }, [user, authRole, authLoading, navigate])

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || user.user_metadata?.name || "")
        }
    }, [user])

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

    const handleSubmit = async () => {
        if (!user || !role) return
        setLoading(true)

        try {
            if (role === 'startup') {
                const stageVal = (document.getElementById('stage') as HTMLSelectElement)?.value
                const teamSizeVal = (document.getElementById('teamSize') as HTMLInputElement)?.value

                const { error: insertError } = await supabase
                    .from('startups')
                    .insert({
                        id: user.id,
                        name: companyName,
                        founder_name: name,
                        industry: selectedIndustry === 'Others' ? customIndustry : selectedIndustry,
                        stage: stageVal,
                        traction: teamSizeVal ? `${teamSizeVal} employees` : '',
                        valuation: 'Not Disclosed',
                        problem_solving: problemSolving,
                        kyc_status: 'pending'
                    })

                if (insertError) throw insertError

            } else {
                const investorTypeVal = (document.getElementById('investorType') as HTMLSelectElement)?.value
                const investmentRangeVal = (document.getElementById('investmentRange') as HTMLInputElement)?.value
                const investorBioVal = (document.getElementById('investorBio') as HTMLTextAreaElement)?.value

                const expertise = selectedExpertise.includes('Others')
                    ? [...selectedExpertise.filter(e => e !== 'Others'), customExpertise]
                    : selectedExpertise

                const { error: insertError } = await supabase
                    .from('investors')
                    .insert({
                        id: user.id,
                        name: name,
                        investor_type: investorTypeVal,
                        funds_available: investmentRangeVal,
                        bio: investorBioVal,
                        expertise: expertise,
                        kyc_status: 'pending'
                    })

                if (insertError) throw insertError
            }

            // Successfully set up profile, now refresh the auth context to detect the new role
            await refreshUser()
            toast("Welcome to Kasb.AI! Your profile is ready.", "success")
            navigate('/dashboard', { replace: true })

        } catch (err: unknown) {
            console.error("Onboarding Error:", err)
            const message = err instanceof Error ? err.message : "Failed to complete onboarding"
            toast(message, "error")
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tighter">KASB.AI</h1>
                    <p className="text-gray-500 font-medium mt-2">Let's set up your personalized experience</p>
                </div>

                <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-gray-100 relative transition-all duration-300 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="p-8 pb-4 text-center">
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 w-12 rounded-full transition-all duration-500",
                                        step === i ? "bg-black w-16" : "bg-gray-100"
                                    )}
                                />
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <CardTitle className="text-3xl font-extrabold tracking-tight">
                                    {step === 1 ? "Choose your journey" : `Complete your ${role} profile`}
                                </CardTitle>
                                <CardDescription className="text-gray-500 font-medium text-lg mt-1">
                                    {step === 1
                                        ? "Are you building something great or looking to support it?"
                                        : "Help us match you with the right opportunities"}
                                </CardDescription>
                            </motion.div>
                        </AnimatePresence>
                    </CardHeader>

                    <CardContent className="p-8 pt-4">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <button
                                        onClick={() => {
                                            setRole('startup')
                                            setStep(2)
                                        }}
                                        className={cn(
                                            "group p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 hover:-translate-y-2",
                                            "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                                        )}
                                    >
                                        <div className="h-14 w-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                                            <Rocket className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">I'm a Startup</h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            I'm building an innovative business and seeking support, visibility, and funding.
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setRole('investor')
                                            setStep(2)
                                        }}
                                        className={cn(
                                            "group p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 hover:-translate-y-2",
                                            "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                                        )}
                                    >
                                        <div className="h-14 w-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform">
                                            <Briefcase className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">I'm an Investor</h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            I'm looking for high-potential startups to support with capital and expertise.
                                        </p>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Display Name</label>
                                            <Input
                                                required
                                                placeholder="Your Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 rounded-xl focus:ring-black"
                                            />
                                        </div>

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

                                    <div className="flex gap-4 pt-4 border-t border-gray-50">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(1)}
                                            className="h-14 rounded-2xl px-6 font-bold"
                                        >
                                            <ArrowLeft className="h-5 w-5 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 bg-black text-white hover:bg-gray-800 rounded-2xl h-14 text-base font-bold shadow-xl transition-all active:scale-[0.98] group"
                                        >
                                            {loading ? "Finalizing..." : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Complete Setup
                                                    <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
