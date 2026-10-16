import { useEffect, useState } from 'react'
import { getAllAirports } from '@/api/queries/airports/getAllAirports'
import type { Airport } from '@/types/skyroute.types'

export function useAllAirports() {
  const [airports, setAirports] = useState<Airport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAllAirports()
      .then((data) => {
        if (!cancelled) setAirports(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load airports')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { airports, loading, error }
}
