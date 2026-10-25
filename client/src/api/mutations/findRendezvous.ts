import { api } from '@/api/client'
import type { HubOption, RendezvousRequest, RendezvousResponse } from '@/types/skyroute.types'

function num(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function hub(raw: HubOption): HubOption {
  return {
    hub: raw.hub,
    city: raw.city,
    totalCost: num(raw.totalCost),
    variance: num(raw.variance),
    avgDurationMinutes: num(raw.avgDurationMinutes),
    perOrigin: (raw.perOrigin ?? []).map((row) => ({
      origin: row.origin,
      cost: num(row.cost),
      durationMinutes: num(row.durationMinutes),
      perPerson: num(row.perPerson),
    })),
  }
}

export async function findRendezvous(request: RendezvousRequest): Promise<RendezvousResponse> {
  const { data } = await api.post<RendezvousResponse>('/api/v1/flights/rendezvous', {
    origins: request.origins,
    departureDate: request.departureDate,
    returnDate: request.returnDate || null,
    currency: request.currency ?? 'USD',
  })
  return {
    currency: data?.currency ?? request.currency ?? 'USD',
    departureDate: data?.departureDate ?? request.departureDate,
    returnDate: data?.returnDate ?? null,
    hubs: (data?.hubs ?? []).map(hub),
  }
}
