export type IataCode = string

export type OptimizationMode = 'min_total' | 'fair_split' | 'duration_balance'

export interface Airport {
  iata: IataCode
  city: string
  name: string
  country: string
}

export interface BaggageSelection {
  personalItem: boolean
  carryOn: number
  checked: number
}

export interface BaggageFees {
  personalItem: number
  carryOn: number
  checked: number
}

export interface StopoverInfo {
  airport: IataCode
  city: string
  layoverMinutes: number
  daylightWindow: string
  downtownMinutes: number
}

export interface FlightOffer {
  id: string
  airline: string
  airlineCode: IataCode
  origin: IataCode
  destination: IataCode
  departAt: string
  arriveAt: string
  durationMinutes: number
  stops: number
  baseFare: number
  currency: string
  baggageFees: BaggageFees
  stopover?: StopoverInfo
  mistakeFare?: boolean
}

export interface SearchParams {
  origin: IataCode
  destination: IataCode
  departureDate: string
  returnDate: string
  passengers: number
}

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
