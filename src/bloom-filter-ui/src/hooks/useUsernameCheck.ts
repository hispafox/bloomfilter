import { useState, useEffect } from 'react'

interface CheckResult {
  username: string
  available: boolean
  note: string
}

export function useUsernameCheck(debounceMs = 300) {
  const [username, setUsername] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (username.length < 3) {
      setResult(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check/${encodeURIComponent(username)}`)
        if (res.ok) {
          const data = await res.json()
          setResult(data)
        }
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [username, debounceMs])

  return { username, setUsername, result, loading }
}
