import { useEffect, useState } from 'react'
import { getAirportByIata } from '@/api/queries/airports/getAirportByIata'
import type { Airport, IataCode } from '@/types/skyroute.types'

export function useAirport(iata: IataCode | undefined) {
  const [airport, setAirport] = useState<Airport | null>(null)

  useEffect(() => {
    if (!iata) {
      setAirport(null)
      return
    }
    let cancelled = false
    getAirportByIata(iata)
      .then((data) => {
        if (!cancelled) setAirport(data)
      })
      .catch(() => {
        if (!cancelled) setAirport(null)
      })
    return () => {
      cancelled = true
    }
  }, [iata])

  return airport
}
