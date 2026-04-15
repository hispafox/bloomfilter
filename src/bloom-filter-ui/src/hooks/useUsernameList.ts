import { useEffect, useState } from 'react'

export interface UsernameListItem {
  username: string
  createdAt: string
}

export function useUsernameList(pollMs = 2000) {
  const [items, setItems] = useState<UsernameListItem[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchList = async () => {
      try {
        const res = await fetch('/api/username/list')
        if (!res.ok) return
        const data: UsernameListItem[] = await res.json()
        if (!cancelled) setItems(data)
      } catch {
        // silent — next tick will retry
      }
    }

    fetchList()
    const interval = setInterval(fetchList, pollMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pollMs])

  return items
}
