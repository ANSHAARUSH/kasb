import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useNavigate } from "react-router-dom"
import { cn } from "../../lib/utils"
import { supabase } from "../../lib/supabase"
import { ArrowLeft, Rocket, Briefcase, CheckCircle2, Upload, FileText, Loader2, PenLine, Sparkles } from "lucide-react"
import { StartupFields } from "./signup/StartupFields"
import { InvestorFields } from "./signup/InvestorFields"
import { INDUSTRIES, EXPERTISE_AREAS } from "../../lib/constants"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { refineProblemStatement, extractStartupDetailsFromPitchDeck } from "../../lib/ai"
import { getGlobalConfig, getUserSetting } from "../../lib/supabase"
import { LoadingScreen } from "../../components/ui/LoadingScreen"
import { extractFullTextFromDocument } from "../../lib/documentExtraction"
import { IDEATION_CONFIG } from "../../lib/questionnaires/ideation"

export function Onboarding() {
    const { user, loading: authLoading, refreshUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState(1) // 1: Role, 2: Method (startup only), 3: Identity, 4: Details
    const [role, setRole] = useState<'investor' | 'startup' | null>(null)
    const [loading, setLoading] = useState(false)

    // Pitch Deck Auto-fill State
    const [entryMethod, setEntryMethod] = useState<'pitchdeck' | 'manual' | null>(null)
    const [isExtracting, setIsExtracting] = useState(false)
    const [uploadedFileName, setUploadedFileName] = useState('')
    const [extractionError, setExtractionError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
    const [questionnaire, setQuestionnaire] = useState<Record<string, Record<string, string>>>({})

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
            // Step 2 is method selection for startups (always valid if a method is picked)
            if (role === 'startup') return entryMethod !== null
            // For investors, step 2 is skipped (they go straight to step 3)
            return true
        }
        if (step === 3) {
            if (role === 'startup') {
                return name.trim() !== '' && companyName.trim() !== '' && selectedIndustry !== ''
            } else {
                return name.trim() !== '' && investorType !== '' && investmentRange.trim() !== ''
            }
        }
        if (step === 4) {
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

    // Pitch Deck Upload Handler
    const handlePitchDeckUpload = async (file: File) => {
        setIsExtracting(true)
        setExtractionError(null)
        setUploadedFileName(file.name)

        try {
            // 1. Extract full text from the document
            const extractedText = await extractFullTextFromDocument(file)

            // 2. Use the universal system API key
            const apiKey = import.meta.env.VITE_PITCHDECK_API_KEY || import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
            if (!apiKey) {
                throw new Error('System AI key is not configured. Please use manual entry.')
            }

            // 3. Send to AI for structured extraction
            const details = await extractStartupDetailsFromPitchDeck(extractedText, apiKey)
            console.log('[Onboarding] Extracted details:', details)

            // 4. Auto-populate form fields
            if (details.companyName) setCompanyName(details.companyName)
            if (details.industry && INDUSTRIES.includes(details.industry as any)) {
                setSelectedIndustry(details.industry)
            } else if (details.industry) {
                setSelectedIndustry('Others')
                setCustomIndustry(details.industry)
            }
            if (details.stage) setStage(details.stage)
            if (details.teamSize) setTeamSize(details.teamSize)
            if (details.problemSolving) setProblemSolving(details.problemSolving)
            if (details.state) setState(details.state)
            if (details.city) setCity(details.city)
            
            if (details.founderName && !name) setName(details.founderName)

            // Populate extended fields into questionnaire
            const mappedQ: Record<string, Record<string, string>> = {}
            IDEATION_CONFIG.forEach(sec => {
                mappedQ[sec.id] = {}
            })
            
            // Map AI extracted fields to questionnaire format
            if (mappedQ.core_problem_solution) {
                mappedQ.core_problem_solution.problem_statement = details.problemSolving || ''
                mappedQ.core_problem_solution.solution_overview = details.solutionOverview || ''
            }
            if (mappedQ.market_customers) {
                mappedQ.market_customers.target_customer = details.targetCustomer || ''
                mappedQ.market_customers.market_size = details.marketSize || ''
                mappedQ.market_customers.why_now = details.whyNow || ''
            }
            if (mappedQ.traction_gtm) {
                mappedQ.traction_gtm.traction_revenue = details.tractionRevenue || ''
                mappedQ.traction_gtm.gtm_plan = details.gtmPlan || ''
            }
            if (mappedQ.competition_business) {
                mappedQ.competition_business.competitive_advantage = details.competitiveAdvantage || ''
                mappedQ.competition_business.business_model = details.businessModel || ''
            }
            if (mappedQ.team) {
                mappedQ.team.founder_details = details.whyYou ? (details.founderName + "\nWhy You: " + details.whyYou) : details.founderName || ''
                mappedQ.team.why_you = details.whyYou || ''
            }
            if (mappedQ.funding_milestones) {
                mappedQ.funding_milestones.funding_amount = details.fundingAsk || ''
                mappedQ.funding_milestones.fund_allocation = details.useOfFunds || ''
                mappedQ.funding_milestones.milestones_12m = details.milestones || ''
            }
            setQuestionnaire(mappedQ)


            console.log('[Onboarding] Fields populated, moving to step 3')

            toast('Pitch deck analyzed! Review the pre-filled details below.', 'success')

            // 5. Jump to the identity step (step 3) so user can review
            setStep(3)
        } catch (err: any) {
            console.error('Pitch deck extraction failed:', err)
            setExtractionError(err.message || 'Failed to extract details from your pitch deck.')
            toast('Extraction failed. You can try again or enter details manually.', 'error')
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
                        kyc_status: 'pending',
                        questionnaire: questionnaire
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

    // Step title helpers
    const getStepTitle = () => {
        if (step === 1) return "Choose your journey"
        if (step === 2 && role === 'startup') return "How would you like to start?"
        if (step === 3) return `Identify as ${role}`
        if (step === 4) return "Traction & Vision"
        return ""
    }

    const getStepDescription = () => {
        if (step === 1) return "Are you building something great or looking to support it?"
        if (step === 2 && role === 'startup') return "Upload your pitch deck for instant auto-fill, or enter details manually"
        if (step === 3) return "Basic details to get started"
        if (step === 4) return "Final details to complete your profile"
        return ""
    }

    // Total steps: 4 for startups, 3 for investors (investors skip method selection)
    const totalSteps = role === 'startup' ? 4 : 3
    const getDisplayStep = () => {
        if (role === 'investor' && step >= 3) return step - 1  // Investors: 1, 3→2, 4→3
        return step
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
                            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 w-12 rounded-full transition-all duration-500",
                                        getDisplayStep() === i ? "bg-black w-16" : getDisplayStep() > i ? "bg-gray-400" : "bg-gray-100"
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
                                    {getStepTitle()}
                                </CardTitle>
                                <CardDescription className="text-gray-500 font-medium text-lg mt-1">
                                    {getStepDescription()}
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
                                            setEntryMethod(null)
                                            setStep(2) // Go to method selection for startups
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
                                            setEntryMethod('manual')
                                            setStep(3) // Investors skip method selection, go to step 3 directly
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
                            ) : step === 2 && role === 'startup' ? (
                                /* Step 2: Method Selection (Startup Only) */
                                <motion.div
                                    key="step2-method"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-6"
                                >
                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.pptx,.docx"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handlePitchDeckUpload(file)
                                        }}
                                    />

                                    {!isExtracting ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Option A: Upload Pitch Deck */}
                                            <button
                                                onClick={() => {
                                                    setEntryMethod('pitchdeck')
                                                    fileInputRef.current?.click()
                                                }}
                                                className={cn(
                                                    "group p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 hover:-translate-y-2",
                                                    "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-indigo-600 hover:shadow-[12px_12px_0px_0px_rgba(79,70,229,0.8)]",
                                                    entryMethod === 'pitchdeck' && "border-indigo-600 shadow-[12px_12px_0px_0px_rgba(79,70,229,0.8)] bg-white"
                                                )}
                                            >
                                                <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                                                    <Upload className="h-7 w-7 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">Upload Pitch Deck</h3>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                                    Let AI read your pitch deck and auto-fill your profile instantly.
                                                </p>
                                                <div className="mt-4 flex items-center gap-2">
                                                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AI-Powered</span>
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-2">Supports PDF, PPTX, DOCX</p>
                                            </button>

                                            {/* Option B: Manual Entry */}
                                            <button
                                                onClick={() => {
                                                    setEntryMethod('manual')
                                                    setStep(3)
                                                }}
                                                className={cn(
                                                    "group p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 hover:-translate-y-2",
                                                    "border-gray-50 bg-gray-50/50 hover:bg-white hover:border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
                                                    entryMethod === 'manual' && "border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white"
                                                )}
                                            >
                                                <div className="h-14 w-14 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-6 transition-transform">
                                                    <PenLine className="h-7 w-7 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">Enter Manually</h3>
                                                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                                    Fill in your startup details step by step.
                                                </p>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Extracting State */
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-12 space-y-6"
                                        >
                                            <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <h3 className="text-xl font-bold text-gray-900">Analyzing Your Pitch Deck</h3>
                                                <p className="text-sm text-gray-500 font-medium max-w-sm">
                                                    AI is reading <span className="font-bold text-indigo-600">{uploadedFileName}</span> and extracting your startup details...
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Extraction Error */}
                                    {extractionError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 space-y-3"
                                        >
                                            <p className="font-medium">{extractionError}</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setExtractionError(null)
                                                        fileInputRef.current?.click()
                                                    }}
                                                    className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                                                >
                                                    Try Again
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setExtractionError(null)
                                                        setEntryMethod('manual')
                                                        setStep(3)
                                                    }}
                                                    className="text-xs font-bold text-gray-600 hover:text-gray-800 underline"
                                                >
                                                    Enter Manually Instead
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Back button */}
                                    <div className="flex items-center mt-8 pt-6 border-t border-gray-100">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setStep(1)
                                                setEntryMethod(null)
                                                setExtractionError(null)
                                            }}
                                            className="px-6 h-12 rounded-xl font-bold text-gray-500 hover:text-black hover:bg-gray-100"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </Button>
                                    </div>
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
                                        {step === 3 && (
                                            <div className="space-y-4">
                                                {/* Auto-fill success banner */}
                                                {entryMethod === 'pitchdeck' && uploadedFileName && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3"
                                                    >
                                                        <div className="h-8 w-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                            <FileText className="h-4 w-4 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-emerald-800">Auto-filled from pitch deck</p>
                                                            <p className="text-[11px] text-emerald-600 truncate">{uploadedFileName} — Review & edit below</p>
                                                        </div>
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                    </motion.div>
                                                )}
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

                                        {step === 4 && (
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
                                                    // Investors skip step 2 (method selection), so go from 3→1
                                                    if (role === 'investor' && step === 3) {
                                                        setStep(1)
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
                                        {((role === 'startup' && step < 4) || (role === 'investor' && step < 4)) && step >= 3 && (
                                            <Button
                                                onClick={nextStep}
                                                disabled={!isStepValid()}
                                                className="px-10 h-14 rounded-[1.5rem] bg-black text-white hover:bg-black/90 font-bold text-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                            >
                                                Next Step
                                            </Button>
                                        )}
                                        {step === 4 && (
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
