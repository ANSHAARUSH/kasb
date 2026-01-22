import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const parseRevenue = (revStr: string): number => {
    if (!revStr) return 0
    const clean = revStr.toUpperCase().replace(/[^0-9.KMB]/g, '')
    let multiplier = 1
    if (clean.includes('K')) multiplier = 1000
    if (clean.includes('M')) multiplier = 1000000
    if (clean.includes('B')) multiplier = 1000000000

    const num = parseFloat(clean.replace(/[KMB]/g, ''))
    return isNaN(num) ? 0 : num * multiplier
}

export function getViewableUrl(url: string | null | undefined) {
    if (!url) return '#'
    // For PPTX/PPT, use Microsoft Office Viewer
    if (url.toLowerCase().endsWith('.pptx') || url.toLowerCase().endsWith('.ppt')) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
    }
    // PDF and others can be viewed directly
    return url
}
