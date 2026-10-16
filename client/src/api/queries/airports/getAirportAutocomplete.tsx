import { api } from '@/api/client'
import type { Airport } from '@/types/skyroute.types'

export async function getAirportAutocomplete(q: string, limit = 10): Promise<Airport[]> {
  const { data } = await api.get<Airport[]>('/api/v1/airports/autocomplete', {
    params: { q, limit },
  })
  return data
}
