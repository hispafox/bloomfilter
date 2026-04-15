import { useEffect, useState } from 'react'

interface VisualizeResult {
  username: string
  positions: number[]
}

export function useVisualize(username: string, debounceMs = 300) {
  const [result, setResult] = useState<VisualizeResult | null>(null)

  useEffect(() => {
    if (username.length < 3) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/visualize/${encodeURIComponent(username)}`)
        if (res.ok) setResult(await res.json())
      } catch {
        setResult(null)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [username, debounceMs])

  return result
}
