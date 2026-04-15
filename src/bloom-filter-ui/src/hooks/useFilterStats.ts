import { useEffect, useState } from 'react'

export interface FilterStats {
  totalItems: number
  filterSizeBits: number
  hashFunctions: number
  estimatedFillRatio: number
  estimatedFalsePositiveRate: number
  memorySizeBytes: number
  bitsSample: number[]
}

export function useFilterStats(pollMs = 1000) {
  const [stats, setStats] = useState<FilterStats | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/username/stats')
        if (!res.ok) return
        const data: FilterStats = await res.json()
        if (!cancelled) setStats(data)
      } catch {
        // silent — next tick will retry
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, pollMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pollMs])

  return stats
}
