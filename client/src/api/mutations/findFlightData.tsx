import { api } from '@/api/client'
import type {
  FlightSearchPage,
  FlightSearchRequest,
  FlightSearchResponse,
} from '@/types/skyroute.types'

function normalize(data: FlightSearchPage | FlightSearchResponse[]): FlightSearchPage {
  // ponytail: tolerate old API that returned a bare array
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      airlines: [],
    }
  }
  return {
    content: data?.content ?? [],
    page: data?.page ?? 0,
    size: data?.size ?? 0,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    airlines: data?.airlines ?? [],
  }
}

export async function findFlightData(request: FlightSearchRequest): Promise<FlightSearchPage> {
  const { data } = await api.post<FlightSearchPage | FlightSearchResponse[]>('/api/v1/flights/search', {
    ...request,
    adults: request.adults ?? 1,
    children: request.children ?? 0,
    infants: request.infants ?? 0,
    bags: request.bags ?? [],
  })
  return normalize(data)
}
