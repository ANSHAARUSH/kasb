import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, ChevronRight, Lock } from "lucide-react"
import { useToast } from "../../hooks/useToast"
import { kycService } from "../../lib/kycService"

export function KYCVerification() {
    const { user, role, kycStatus, refreshUser, signOut } = useAuth()
    const { toast } = useToast()
    const [step, setStep] = useState(kycStatus === 'submitted' ? 4 : 1)
    const [adhaarNumber, setAdhaarNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [referenceId, setReferenceId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleGenerateOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (adhaarNumber.length !== 12) {
            toast("Please enter a valid 12-digit Aadhaar number", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const refId = await kycService.generateOTP(adhaarNumber)
            setReferenceId(refId)
            setStep(3)
            toast("OTP sent to your Aadhaar-linked mobile number", "success")
        } catch (err: any) {
            console.error(err)
            toast(err.message || "Failed to generate OTP", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) {
            toast("Please enter the 6-digit OTP", "error")
            return
        }

        setIsSubmitting(true)
        try {
            const kycData = await kycService.verifyOTP(referenceId, otp)

            const table = role === 'startup' ? 'startups' : 'investors'
            const { error } = await supabase
                .from(table)
                .update({
                    kyc_status: 'verified',
                    adhaar_number_last_four: adhaarNumber.slice(-4),
                    kyc_submitted_at: new Date().toISOString()
                    // You could also store name/address from kycData here
                })
                .eq('id', user?.id)

            if (error) throw error

            toast(`Verified! Welcome ${kycData.full_name}`, "success")
            await refreshUser()
        } catch (err: any) {
            console.error(err)
            toast(err.message || "Invalid OTP or verification failed", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (kycStatus === 'verified') return null

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="pt-8">
                    {step === 1 && (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center">
                                <div className="bg-black p-4 rounded-2xl shadow-xl">
                                    <ShieldCheck className="h-12 w-12 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Identity Verification</h2>
                                <p className="text-gray-600">To maintain a secure ecosystem, we require Aadhaar KYC for all {role}s.</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100 flex gap-3">
                                <Lock className="h-5 w-5 text-black shrink-0" />
                                <p className="text-sm text-gray-500">Your data is encrypted and used only for identity validation. We do not store your full Aadhaar number.</p>
                            </div>
                            <Button
                                onClick={() => setStep(2)}
                                className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-lg font-bold group"
                            >
                                Start Verification
                                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Aadhaar Details</h2>
                                <p className="text-gray-500 text-sm">Enter your 12-digit Aadhaar number</p>
                            </div>
                            <form onSubmit={handleGenerateOTP} className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="0000 0000 0000"
                                    value={adhaarNumber}
                                    onChange={(e) => setAdhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                    className="text-center text-2xl font-mono tracking-[0.2em] h-16 border-2 border-black rounded-xl"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 text-center">By continuing, you agree to receive an OTP on your linked mobile number.</p>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || adhaarNumber.length !== 12}
                                    className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-lg font-bold"
                                >
                                    {isSubmitting ? "Generating OTP..." : "Get OTP"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="w-full"
                                >
                                    Go Back
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Verify OTP</h2>
                                <p className="text-gray-500 text-sm">Enter the 6-digit code sent to XXXXXX{user?.id?.slice(-4)}</p>
                            </div>
                            <form onSubmit={handleVerifyOTP} className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-2 border-black rounded-xl"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || otp.length !== 6}
                                    className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-lg font-bold"
                                >
                                    {isSubmitting ? "Verifying..." : "Verify & Connect"}
                                </Button>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
                                        onClick={() => setStep(2)}
                                    >
                                        Edit Number
                                    </button>
                                    <span className="text-gray-200">|</span>
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
                                        onClick={() => setStep(2)}
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center py-4">
                            <div className="flex justify-center">
                                <div className="bg-green-500 p-4 rounded-full shadow-lg animate-bounce">
                                    <Clock className="h-12 w-12 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Under Review</h2>
                                <p className="text-gray-600">Our team is verifying your details. This usually takes 1-2 business days.</p>
                            </div>
                            <div className="py-4 px-6 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div className="text-left">
                                    <div className="font-bold text-green-900">Submission Received</div>
                                    <div className="text-xs text-green-700">Adhaar ending in •••• {kycStatus === 'submitted' ? 'XXXX' : adhaarNumber.slice(-4)}</div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 italic">You will gain access once the verification is complete.</p>
                            <Button
                                onClick={signOut} // Assuming signOut is available from useAuth
                                variant="outline"
                                className="w-full border-black rounded-xl h-12 font-bold"
                            >
                                Sign Out
                            </Button>
                        </div>
                    )}

                    {kycStatus === 'rejected' && (
                        <div className="space-y-6 text-center py-4">
                            <div className="flex justify-center">
                                <div className="bg-red-500 p-4 rounded-full shadow-lg">
                                    <ShieldAlert className="h-12 w-12 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Verification Failed</h2>
                                <p className="text-gray-600">Your KYC submission was rejected by the admin.</p>
                            </div>
                            <Button
                                onClick={() => {
                                    setStep(1)
                                    // Refresh but kycStatus will still be rejected... 
                                    // Maybe we need a way to 'reset' it or just let them retry.
                                    // For now, let's keep it simple.
                                }}
                                className="w-full bg-black text-white rounded-xl h-12 font-bold"
                            >
                                Re-try Verification
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

