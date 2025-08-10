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

// Simple in-memory request limiter
type RateRecord = {
  count: number
  reset: number
}

const rateStore = new Map<string, RateRecord>()

export function checkRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const record = rateStore.get(key)
  if (!record || record.reset <= now) {
    rateStore.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (record.count >= limit) return false
  record.count++
  return true
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}
