import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { ToastContext, type Toast, type ToastType } from "../../hooks/useToast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = React.useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])

        // Auto dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            layout
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-md min-w-[300px]",
                                t.type === "success" && "bg-white/90 border-green-200 text-green-800",
                                t.type === "error" && "bg-white/90 border-red-200 text-red-800",
                                t.type === "info" && "bg-white/90 border-gray-200 text-gray-800"
                            )}
                        >
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                t.type === "success" && "bg-green-500",
                                t.type === "error" && "bg-red-500",
                                t.type === "info" && "bg-blue-500"
                            )} />
                            <p className="flex-1 text-sm font-medium">{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}
