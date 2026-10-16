import { api } from '@/api/client'
import type {
  FlightSearchRequest,
  FlightSearchResponse,
  PaginatedResponse,
} from '@/types/skyroute.types'

function normalize(
  data: PaginatedResponse<FlightSearchResponse> | FlightSearchResponse[],
): PaginatedResponse<FlightSearchResponse> {
  // ponytail: tolerate old API that returned a bare array
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    }
  }
  return {
    content: data?.content ?? [],
    page: data?.page ?? 0,
    size: data?.size ?? 0,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
  }
}

export async function findFlightData(
  request: FlightSearchRequest,
): Promise<PaginatedResponse<FlightSearchResponse>> {
  const { data } = await api.post<
    PaginatedResponse<FlightSearchResponse> | FlightSearchResponse[]
  >('/api/v1/flights/search', {
    ...request,
    adults: request.adults ?? 1,
    children: request.children ?? 0,
    infants: request.infants ?? 0,
    bags: request.bags ?? [],
  })
  return normalize(data)
}
