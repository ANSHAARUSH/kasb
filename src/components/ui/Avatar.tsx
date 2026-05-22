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

    const isPlaceholder = (path: string) => {
        const p = path.toLowerCase()
        return p.includes('placeholder') ||
            p.includes('dummy') ||
            p.includes('random') ||
            p.includes('i.pravatar.cc') ||
            p.includes('ui-avatars.com') ||
            p.includes('dicebear.com') ||
            p.includes('unsplash.com') ||
            p.includes('pexels.com') ||
            p.includes('pixabay.com')
    }

    const isInternalOrExternal = (path: string) => {
        if (!path || isPlaceholder(path)) return false
        return path.startsWith('http') || path.startsWith('/') || path.startsWith('.') || path.startsWith('data:') || (!path.includes('://') && path.includes('.'))
    }

    const renderFallback = () => {
        return (
            <div className={cn("flex h-full w-full items-center justify-center bg-[#E6E6E6] text-[#FFFFFF]", fallbackClassName)}>
                <svg viewBox="0 0 24 24" className="w-full h-full p-[15%] drop-shadow-sm" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
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
