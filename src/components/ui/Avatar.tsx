import { useState } from "react"
import { cn } from "../../lib/utils"

interface AvatarProps {
    src?: string | null
    name?: string | null
    className?: string
    fallbackClassName?: string
}

export function Avatar({ src, name, className, fallbackClassName }: AvatarProps) {
    const [error, setError] = useState(false)
    const [prevSrc, setPrevSrc] = useState(src)

    if (src !== prevSrc) {
        setPrevSrc(src)
        setError(false)
    }

    const isInternalOrExternal = (path: string) => {
        return path.startsWith('http') || path.startsWith('/') || path.startsWith('.') || path.startsWith('data:') || (!path.includes('://') && path.includes('.'))
    }

    const getInitials = (n?: string | null) => {
        if (!n) return '?'
        return n.charAt(0).toUpperCase()
    }

    const renderFallback = () => {
        // If src is a 1-2 character string (like an emoji or initials), use it as fallback
        if (src && src.length <= 2) {
            return (
                <div className={cn("flex h-full w-full items-center justify-center font-bold", fallbackClassName)}>
                    {src}
                </div>
            )
        }

        return (
            <div className={cn("flex h-full w-full items-center justify-center font-bold", fallbackClassName)}>
                {getInitials(name)}
            </div>
        )
    }

    if (!src || error || !isInternalOrExternal(src)) {
        return renderFallback()
    }

    return (
        <img
            src={src}
            alt={name || "Avatar"}
            className={cn("h-full w-full object-cover", className)}
            onError={() => setError(true)}
        />
    )
}
