import { useEffect, useState } from 'react'
import { getAirportAutocomplete } from '@/api/queries/airports/getAirportAutocomplete'
import { getPopularAirports } from '@/api/queries/airports/getPopularAirports'
import type { Airport } from '@/types/skyroute.types'

export function useAirportAutocomplete(q: string, enabled: boolean, limit = 10) {
  const [airports, setAirports] = useState<Airport[]>([])
  const [loading, setLoading] = useState(false)
  const [debounced, setDebounced] = useState(q)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setLoading(true)

    const req = debounced.trim()
      ? getAirportAutocomplete(debounced.trim(), limit)
      : getPopularAirports(limit)

    req
      .then((data) => {
        if (!cancelled) setAirports(data)
      })
      .catch(() => {
        if (!cancelled) setAirports([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced, enabled, limit])

  return { airports, loading }
}
