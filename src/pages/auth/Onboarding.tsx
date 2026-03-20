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
import { refineProblemStatement, extractStartupInfoFromPitchDeck } from "../../lib/ai"
import { getGlobalConfig, getUserSetting } from "../../lib/supabase"
import { LoadingScreen } from "../../components/ui/LoadingScreen"
import { FileUp, Sparkles, User, HelpCircle } from "lucide-react"

export function Onboarding() {
    const { user, loading: authLoading, refreshUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState(1) // 1: Role, 2: Identity/Method, 3: Details
    const [role, setRole] = useState<'investor' | 'startup' | null>(null)
    const [onboardingMethod, setOnboardingMethod] = useState<'ai' | 'manual' | null>(null)
    const [loading, setLoading] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)

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
            if (role === 'startup') {
                if (!onboardingMethod) return false
                if (onboardingMethod === 'manual') {
                    return name.trim() !== '' && companyName.trim() !== '' && selectedIndustry !== ''
                }
                return name.trim() !== '' // AI method only needs name (or we get it from deck)
            } else {
                return name.trim() !== '' && investorType !== '' && investmentRange.trim() !== ''
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

    const handlePitchDeckUpload = async (file: File) => {
        if (!file || !user) return
        setIsExtracting(true)
        try {
            let apiKey = import.meta.env.VITE_GROQ_API_KEY
            if (!apiKey) apiKey = await getGlobalConfig('ai_api_key') || ''
            if (!apiKey) apiKey = await getUserSetting(user.id, 'ai_api_key') || ''

            if (!apiKey) {
                toast("AI services not configured. Please enter details manually.", "error")
                setOnboardingMethod('manual')
                return
            }

            const info = await extractStartupInfoFromPitchDeck(file, apiKey)
            
            if (info.name) setCompanyName(info.name)
            if (info.founder_name) setName(info.founder_name)
            if (info.industry) {
                const match = INDUSTRIES.find(i => i.toLowerCase() === info.industry.toLowerCase())
                if (match) setSelectedIndustry(match)
                else {
                    setSelectedIndustry('Others')
                    setCustomIndustry(info.industry)
                }
            }
            if (info.stage) setStage(info.stage)
            if (info.problem_solving) setProblemSolving(info.problem_solving)
            if (info.team_size) setTeamSize(info.team_size.replace(/[^\d]/g, ''))
            if (info.location?.state) setState(info.location.state)
            if (info.location?.city) setCity(info.location.city)
            
            toast("Pitch deck analyzed! Review your details in the next step.", "success")
            setStep(3)
        } catch (err: any) {
            toast(`Extraction failed: ${err.message}. Switching to manual.`, "error")
            setOnboardingMethod('manual')
        } finally {
            setIsExtracting(false)
        }
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

    if (authLoading) return <LoadingScreen />

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
                                                    <div className="space-y-6">
                                                        {!onboardingMethod ? (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                <button
                                                                    onClick={() => setOnboardingMethod('ai')}
                                                                    className="group p-6 rounded-3xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                                                                >
                                                                    <div className="flex items-center gap-4 mb-3">
                                                                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white">
                                                                            <Sparkles className="h-5 w-5" />
                                                                        </div>
                                                                        <h4 className="font-bold text-lg">AI-Powered Setup</h4>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 font-medium">Upload your pitch deck and let AI pre-fill your profile in seconds.</p>
                                                                </button>

                                                                <button
                                                                    onClick={() => setOnboardingMethod('manual')}
                                                                    className="group p-6 rounded-3xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                                                                >
                                                                    <div className="flex items-center gap-4 mb-3">
                                                                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white">
                                                                            <User className="h-5 w-5" />
                                                                        </div>
                                                                        <h4 className="font-bold text-lg">Manual Entry</h4>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 font-medium">Prefer to enter your details yourself? Choose this for a step-by-step setup.</p>
                                                                </button>
                                                            </div>
                                                        ) : onboardingMethod === 'ai' ? (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-bold text-lg">Upload Pitch Deck</h4>
                                                                    <button onClick={() => setOnboardingMethod(null)} className="text-xs font-bold text-gray-400 hover:text-black">Change Method</button>
                                                                </div>
                                                                
                                                                <div className="relative group">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.pptx,image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0]
                                                                            if (file) handlePitchDeckUpload(file)
                                                                        }}
                                                                        disabled={isExtracting}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                                                    />
                                                                    <div className={cn(
                                                                        "p-10 border-2 border-dashed rounded-[2.5rem] text-center transition-all",
                                                                        isExtracting ? "border-black bg-gray-50 animate-pulse" : "border-gray-200 group-hover:border-black group-hover:bg-gray-50"
                                                                    )}>
                                                                        <div className="h-16 w-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                                            <FileUp className="h-8 w-8 text-white" />
                                                                        </div>
                                                                        <h5 className="font-bold mb-1">{isExtracting ? "Analyzing Deck..." : "Drop your deck here"}</h5>
                                                                        <p className="text-sm text-gray-500 font-medium">Supports PDF, PPTX, or Images</p>
                                                                    </div>
                                                                </div>

                                                                <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                                                                    <HelpCircle className="h-5 w-5 text-blue-500 shrink-0" />
                                                                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                                                        Our AI extracts company name, industry, stage, and problem statement to save you time.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="font-bold text-lg">Step-by-step Setup</h4>
                                                                    <button onClick={() => setOnboardingMethod(null)} className="text-xs font-bold text-gray-400 hover:text-black">Change Method</button>
                                                                </div>
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
                                                        )}
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

                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                                        {step > 1 && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    if (step === 2 && role === 'startup' && onboardingMethod) {
                                                        setOnboardingMethod(null)
                                                    } else {
                                                        setStep(prev => prev - 1)
                                                    }
                                                }}
                                                className="px-6 h-12 rounded-xl font-bold text-gray-500 hover:text-black hover:bg-gray-100"
                                            >
                                                <ArrowLeft className="h-4 w-4 mr-2" />
                                                Back
                                            </Button>
                                        )}
                                        <div className="flex-1" />
                                        {step < 3 && (role !== 'startup' || (step === 2 && onboardingMethod === 'manual') || (step === 1)) && (
                                            <Button
                                                onClick={nextStep}
                                                disabled={!isStepValid()}
                                                className="px-10 h-14 rounded-[1.5rem] bg-black text-white hover:bg-black/90 font-bold text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                            >
                                                Next Step
                                            </Button>
                                        )}
                                        {step === 3 && (
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={loading || !isStepValid()}
                                                className="px-12 h-14 rounded-[1.5rem] bg-black text-white hover:bg-black/90 font-bold text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                            >
                                                {loading ? "Creating Profile..." : "Complete Setup"}
                                                <CheckCircle2 className="h-5 w-5 ml-2" />
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
