import { api } from '@/api/client'
import type { Airport } from '@/types/skyroute.types'

export async function getMajorHubs(): Promise<Airport[]> {
  const { data } = await api.get<Airport[]>('/api/v1/airports/hubs')
  return data
}
