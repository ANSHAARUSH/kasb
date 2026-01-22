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
import { getGlobalConfig, getUserSetting } from "../../lib/supabase"

export function Onboarding() {
    const { user, loading: authLoading, refreshUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState(1) // 1: Role Selection, 2: Identity, 3: Traction/Expertise
    const [role, setRole] = useState<'investor' | 'startup' | null>(null)
    const [loading, setLoading] = useState(false)

    // Shared Fields
    const [name, setName] = useState("")
    const [state, setState] = useState("")
    const [city, setCity] = useState("")

    // Startup Specific
    const [companyName, setCompanyName] = useState('')
    const [selectedIndustry, setSelectedIndustry] = useState<string>('')
    const [customIndustry, setCustomIndustry] = useState<string>('')
    const [problemSolving, setProblemSolving] = useState('')
    const [isRefining, setIsRefining] = useState(false)
    const [stage, setStage] = useState('')
    const [teamSize, setTeamSize] = useState('')

    // Investor Specific
    const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
    const [customExpertise, setCustomExpertise] = useState<string>('')
    const [investorType, setInvestorType] = useState('')
    const [investmentRange, setInvestmentRange] = useState('')
    const [investorBio, setInvestorBio] = useState('')

    useEffect(() => {
        if (!authLoading && user) {
            if (user.user_metadata?.full_name && !name) {
                setName(user.user_metadata.full_name)
            }
        }
    }, [user, authLoading])

    const isStepValid = () => {
        if (step === 1) return role !== null
        if (step === 2) {
            if (!name.trim()) return false
            if (role === 'startup') {
                return companyName.trim() !== '' && selectedIndustry !== ''
            } else {
                return investorType !== '' && investmentRange.trim() !== ''
            }
        }
        if (step === 3) {
            if (!state.trim() || !city.trim()) return false
            if (role === 'startup') {
                return stage !== '' && problemSolving.trim() !== ''
            } else {
                return investorBio.trim() !== '' && selectedExpertise.length > 0
            }
        }
        return false
    }

    const nextStep = () => {
        if (isStepValid()) setStep(prev => prev + 1)
        else toast("Please fill in all required fields", "error")
    }

    const handleRefineProblem = async () => {
        if (!problemSolving.trim()) return
        setIsRefining(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || ''
            if (!apiKey && user) apiKey = await getUserSetting(user.id, 'ai_api_key') || ''

            if (!apiKey) {
                toast("AI Refinement is not configured. Please check your settings.", "error")
                return
            }
            let refined = await refineProblemStatement(problemSolving, apiKey)

            // Try to parse if it's JSON, otherwise use as is
            try {
                const parsed = JSON.parse(refined.replace(/```json\n?|\n?```/g, '').trim())
                if (parsed.refined) {
                    refined = parsed.refined
                }
            } catch (e) {
                // If not JSON, use the raw string (it might already be refined text)
                console.warn("AI response was not JSON or failed to parse:", refined)
            }

            setProblemSolving(refined)
            toast("Statement refined by AI!", "success")
        } catch (err) {
            toast("AI refinement failed, but your entry is saved.", "error")
        } finally {
            setIsRefining(false)
        }
    }

    const handleSubmit = async () => {
        if (!user || !role) return
        if (!isStepValid()) {
            toast("Please complete all steps", "error")
            return
        }
        setLoading(true)

        try {
            if (role === 'startup') {
                const { error: insertError } = await supabase
                    .from('startups')
                    .insert({
                        id: user.id,
                        name: companyName,
                        founder_name: name,
                        industry: selectedIndustry === 'Others' ? customIndustry : selectedIndustry,
                        stage: stage,
                        traction: teamSize ? `${teamSize} employees` : '',
                        valuation: 'Not Disclosed',
                        problem_solving: problemSolving,
                        state,
                        city,
                        kyc_status: 'pending'
                    })

                if (insertError) throw insertError

            } else {
                const expertise = selectedExpertise.includes('Others')
                    ? [...selectedExpertise.filter(e => e !== 'Others'), customExpertise]
                    : selectedExpertise

                const { error: insertError } = await supabase
                    .from('investors')
                    .insert({
                        id: user.id,
                        name: name,
                        investor_type: investorType,
                        funds_available: investmentRange,
                        bio: investorBio,
                        expertise: expertise,
                        state,
                        city,
                        kyc_status: 'pending'
                    })

                if (insertError) throw insertError
            }

            await refreshUser()
            toast("Welcome to Kasb.AI! Your profile is ready.", "success")
            navigate('/dashboard', { replace: true })

        } catch (err: any) {
            console.error("Onboarding Error:", err)
            const message = err?.message || (typeof err === 'string' ? err : "Failed to complete onboarding")
            toast(`Error: ${message}`, "error")
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
                            {[1, 2, 3].map((i) => (
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
                                    {step === 1 ? "Choose your journey" : step === 2 ? `Identify as ${role}` : "Traction & Vision"}
                                </CardTitle>
                                <CardDescription className="text-gray-500 font-medium text-lg mt-1">
                                    {step === 1
                                        ? "Are you building something great or looking to support it?"
                                        : step === 2 ? "Basic details to get started" : "Final details to complete your profile"}
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
                                            "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
                                            role === 'startup' && "border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white"
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
                                            "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
                                            role === 'investor' && "border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white"
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
                                    key="step-content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        {step === 2 && (
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
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Company Name</label>
                                                            <Input
                                                                required
                                                                placeholder="Enter your startup name"
                                                                value={companyName}
                                                                onChange={(e) => setCompanyName(e.target.value)}
                                                                className="h-12 rounded-xl focus:ring-black"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Industry</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {INDUSTRIES.map((ind) => (
                                                                    <button
                                                                        key={ind}
                                                                        type="button"
                                                                        onClick={() => setSelectedIndustry(ind)}
                                                                        className={cn(
                                                                            "px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                                                                            selectedIndustry === ind
                                                                                ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                                        )}
                                                                    >
                                                                        {ind}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {selectedIndustry === 'Others' && (
                                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                                                                    <Input
                                                                        placeholder="Specify your industry"
                                                                        value={customIndustry}
                                                                        onChange={(e) => setCustomIndustry(e.target.value)}
                                                                        className="h-12 rounded-xl focus:ring-black"
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Investor Type</label>
                                                            <select
                                                                id="investorType"
                                                                required
                                                                value={investorType}
                                                                onChange={(e) => setInvestorType(e.target.value)}
                                                                className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                                            >
                                                                <option value="">Select Type</option>
                                                                <option>Angel Investor</option>
                                                                <option>Venture Capitalist</option>
                                                                <option>Family Office</option>
                                                                <option>Strategic Investor</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium text-gray-700">Investment Range</label>
                                                            <Input
                                                                id="investmentRange"
                                                                required
                                                                placeholder="e.g. $10K-$50K"
                                                                value={investmentRange}
                                                                onChange={(e) => setInvestmentRange(e.target.value)}
                                                                className="h-12 rounded-xl focus:ring-black"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="space-y-4">
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
                                                        state={state}
                                                        setState={setState}
                                                        city={city}
                                                        setCity={setCity}
                                                        stage={stage}
                                                        setStage={setStage}
                                                        teamSize={teamSize}
                                                        setTeamSize={setTeamSize}
                                                    />
                                                ) : (
                                                    <InvestorFields
                                                        expertiseAreas={EXPERTISE_AREAS}
                                                        selectedExpertise={selectedExpertise}
                                                        setSelectedExpertise={setSelectedExpertise}
                                                        customExpertise={customExpertise}
                                                        setCustomExpertise={setCustomExpertise}
                                                        state={state}
                                                        setState={setState}
                                                        city={city}
                                                        setCity={setCity}
                                                        investorType={investorType}
                                                        setInvestorType={setInvestorType}
                                                        investmentRange={investmentRange}
                                                        setInvestmentRange={setInvestmentRange}
                                                        investorBio={investorBio}
                                                        setInvestorBio={setInvestorBio}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-50">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(prev => prev - 1)}
                                            className="h-14 rounded-2xl px-6 font-bold"
                                        >
                                            <ArrowLeft className="h-5 w-5 mr-2" />
                                            Back
                                        </Button>
                                        {step === 3 ? (
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={loading || !isStepValid()}
                                                className="flex-1 bg-black text-white hover:bg-gray-800 rounded-2xl h-14 text-base font-bold shadow-xl transition-all active:scale-[0.98] group"
                                            >
                                                {loading ? "Finalizing..." : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        Complete Setup
                                                        <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                    </span>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={nextStep}
                                                disabled={!isStepValid()}
                                                className="flex-1 bg-black text-white hover:bg-gray-800 rounded-2xl h-14 text-base font-bold shadow-xl transition-all active:scale-[0.98]"
                                            >
                                                Continue
                                            </Button>
                                        )}
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
