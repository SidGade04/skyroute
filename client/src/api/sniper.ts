import axios from 'axios'
import { api } from '@/api/client'

export type SniperCondition = {
  op: 'LTE' | 'LT' | 'BETWEEN' | 'PCT_BELOW'
  amount: number | null
  min: number | null
  max: number | null
  pct: number | null
  basis: 'SNAPSHOT' | 'USER' | null
}

export type SniperQuote = {
  price: number
  currency: string
  date: string
  offerId: string | null
}

export type Sniper = {
  id: string
  origin: string
  destination: string
  windowStart: string
  windowEnd: string
  currency: string
  matchMode: string
  conditions: SniperCondition[]
  snapshotPrice: number
  snapshotDate: string | null
  status: 'ARMED' | 'TRIGGERED' | 'DISARMED' | 'EXPIRED'
  lastPrice: number | null
  triggeredPrice: number | null
  cheapestDate: string | null
  armedAt: string
  triggeredAt: string | null
}

export type SniperBody = {
  origin: string
  destination: string
  windowStart: string
  windowEnd: string
  currency: string
  matchMode: 'ANY'
  conditions?: SniperCondition[]
}

function failure(e: unknown) {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as { message?: string } | undefined
    return new Error(body?.message || e.message)
  }
  return e instanceof Error ? e : new Error('Request failed')
}

export async function quoteSniper(body: SniperBody): Promise<SniperQuote> {
  try {
    const { data } = await api.post<SniperQuote>('/api/v1/snipers/quote', body)
    return data
  } catch (e) {
    throw failure(e)
  }
}

export async function listSnipers(): Promise<Sniper[]> {
  try {
    const { data } = await api.get<Sniper[]>('/api/v1/snipers')
    return data
  } catch (e) {
    throw failure(e)
  }
}

export async function armSniper(body: SniperBody): Promise<Sniper> {
  try {
    const { data } = await api.post<Sniper>('/api/v1/snipers', body)
    return data
  } catch (e) {
    throw failure(e)
  }
}

export async function disarmSniper(id: string): Promise<Sniper> {
  try {
    const { data } = await api.post<Sniper>(`/api/v1/snipers/${id}/disarm`)
    return data
  } catch (e) {
    throw failure(e)
  }
}

export async function deleteSniper(id: string): Promise<void> {
  try {
    await api.delete(`/api/v1/snipers/${id}`)
  } catch (e) {
    throw failure(e)
  }
}

export async function rearmSniper(id: string): Promise<Sniper> {
  try {
    const { data } = await api.post<Sniper>(`/api/v1/snipers/${id}/rearm`)
    return data
  } catch (e) {
    throw failure(e)
  }
}
