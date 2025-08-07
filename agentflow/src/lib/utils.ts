import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a JavaScript Date or ISO string into a short relative time, e.g. "2h ago"
export function formatRelativeTime(date: string | number | Date): string {
  try {
    const target = new Date(date)
    const diffMs = Date.now() - target.getTime()
    const abs = Math.abs(diffMs)

    const seconds = Math.floor(abs / 1000)
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`

    const years = Math.floor(months / 12)
    return `${years}y ago`
  } catch {
    return ''
  }
}
