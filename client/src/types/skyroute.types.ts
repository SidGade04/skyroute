export type IataCode = string

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

export interface Airport {
  iata: IataCode
  city: string
  name: string
  country: string
}

export interface FlightSearchRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  adults: number
  children: number
  infants: number
  /** Each entry = one checked bag weight in kg */
  bags: number[]
  cabinClass?: CabinClass
  page?: number
  size?: number
}

export interface FlightSlice {
  originCode: string
  destinationCode: string
  departureTime: string
  arrivalTime: string
  duration: string
}

export interface PriceBreakdown {
  fare: number
  taxes: number
  baggageFees: number
  total: number
  adults: number
  children: number
  infants: number
  /** Checked bags included in the fare (from airline / cabin) */
  includedBags: number
  /** Bags beyond included allowance that incur a piece fee */
  extraBags: number
  /** Infant charged by airline rules inside fare+taxes — not a client estimate */
  infantNote: string | null
}

export interface FlightSearchResponse {
  offerId: string
  airlineName: string
  airlineLogoUrl: string | null
  basePrice: number
  baggageFees: number
  totalPrice: number
  currency: string
  slices: FlightSlice[]
  breakdown: PriceBreakdown
}

export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// rendezvous (still mock UI)
export type OptimizationMode = 'min_total' | 'fair_split' | 'duration_balance'

export interface RendezvousOrigin {
  airport: IataCode
  travelers: number
}

export interface HubOption {
  hub: IataCode
  city: string
  totalCost: number
  variance: number
  avgDurationMinutes: number
  perOrigin: { origin: IataCode; cost: number; durationMinutes: number }[]
}
