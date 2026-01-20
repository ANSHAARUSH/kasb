import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2, X, CreditCard, ShieldCheck } from "lucide-react"
import { Button } from "../ui/button"
import { subscriptionManager, type SubscriptionTier } from "../../lib/subscriptionManager"
import { useAuth } from "../../context/AuthContext"
import { purchaseImpactPoints } from "../../lib/supabase"

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    tier: {
        id: SubscriptionTier
        name: string
        price: number
        points?: number
    } | null
}

export function PaymentModal({ isOpen, onClose, tier }: PaymentModalProps) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle')
    const { user, role } = useAuth()

    useEffect(() => {
        if (!isOpen) {
            setStatus('idle')
        }
    }, [isOpen])

    const handlePayment = async () => {
        if (!tier || !user || !role) return
        setStatus('processing')

        try {
            if (tier.id === 'addon' as any && tier.points) {
                // Handle Impact Point purchase
                await purchaseImpactPoints(user.id, tier.points, tier.price)
            } else {
                // subscriptionManager.setTier now handles Supabase sync with user_subscriptions table
                await subscriptionManager.setTier(tier.id)
                subscriptionManager.resetUsage()
            }

            // Simulate network delay for UX
            await new Promise(resolve => setTimeout(resolve, 1500))

            setStatus('success')

            // Final delay before closing
            await new Promise(resolve => setTimeout(resolve, 2000))
            onClose()
            window.location.reload()
        } catch (error: any) {
            console.error('Upgrade error:', error)
            alert(`Failed to process payment: ${error.message || 'Unknown error'}. Please ensure you have run the required SQL script in Supabase.`)
            setStatus('idle')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="text-center">
                            {status === 'idle' && (
                                <>
                                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-black">
                                        <CreditCard className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Simulate Payment</h3>
                                    <p className="text-gray-500 mb-8 px-4">
                                        You are upgrading to <strong>{tier?.name}</strong>. This is a testing simulation. No real money will be charged.
                                    </p>

                                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-400">Selected Plan</span>
                                            <span className="font-bold">{tier?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Total Due</span>
                                            <span className="font-bold">₹{tier?.price.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handlePayment}
                                        className="w-full h-14 rounded-2xl text-lg font-bold bg-black hover:scale-[1.02] transition-transform"
                                    >
                                        Upgrade Now
                                    </Button>

                                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                                        <ShieldCheck className="h-4 w-4" />
                                        Secure Sandbox Environment
                                    </div>
                                </>
                            )}

                            {status === 'processing' && (
                                <div className="py-12 flex flex-col items-center">
                                    <Loader2 className="h-12 w-12 text-black animate-spin mb-6" />
                                    <h3 className="text-xl font-bold mb-2">Processing Payment</h3>
                                    <p className="text-gray-500 italic">Connecting to secure gateway...</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className="py-12 flex flex-col items-center"
                                >
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
                                        <Check className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Upgrade Successful!</h3>
                                    <p className="text-gray-500 mb-2">Your new features are now active.</p>
                                    <p className="text-sm font-medium text-black">Redirecting to dashboard...</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
