import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

interface DeleteAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    expectedName: string
}

export function DeleteAccountModal({ isOpen, onClose, onConfirm, expectedName }: DeleteAccountModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [confirmName, setConfirmName] = useState("")
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setStep(1)
        setConfirmName("")
        onClose()
    }

    const handleDelete = async () => {
        if (confirmName !== expectedName) return
        setLoading(true)
        await onConfirm()
        setLoading(false)
        handleClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6" />
                                    Delete Account
                                </h2>
                                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="p-6">
                                {step === 1 ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-900 text-sm font-medium">
                                            Warning: This action is permanent and cannot be undone. All your data, matches, and messages will be permanently erased.
                                        </div>
                                        <p className="text-gray-600">
                                            Are you sure you want to delete your account? You will lose access to the platform immediately.
                                        </p>
                                        <div className="flex gap-3 mt-6">
                                            <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={handleClose}>
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                                onClick={() => setStep(2)}
                                            >
                                                Continue
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-gray-600 text-sm">
                                            To confirm deletion, please type <span className="font-bold text-black select-all">{expectedName}</span> below:
                                        </p>
                                        <Input
                                            value={confirmName}
                                            onChange={(e) => setConfirmName(e.target.value)}
                                            placeholder={expectedName}
                                            className="font-mono text-center border-red-200 focus:ring-red-500"
                                            autoFocus
                                        />
                                        <div className="flex gap-3 mt-6">
                                            <Button variant="ghost" className="flex-1 rounded-xl font-bold" onClick={() => setStep(1)} disabled={loading}>
                                                Back
                                            </Button>
                                            <Button
                                                className={cn(
                                                    "flex-1 rounded-xl font-bold transition-all",
                                                    confirmName === expectedName
                                                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                )}
                                                onClick={handleDelete}
                                                disabled={confirmName !== expectedName || loading}
                                            >
                                                {loading ? "Deleting..." : (
                                                    <span className="flex items-center gap-2">
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete Forever
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
