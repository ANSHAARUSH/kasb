import * as React from "react"

export type ToastType = "success" | "error" | "info"

export interface Toast {
    id: string
    message: string
    type: ToastType
}

export interface ToastContextType {
    toast: (message: string, type?: ToastType) => void
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = React.useContext(ToastContext)
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
