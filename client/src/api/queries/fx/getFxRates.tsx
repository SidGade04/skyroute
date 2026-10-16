import { api } from '@/api/client'

export type FxRates = {
  base: string
  date: string
  rates: Record<string, number>
}

export async function getFxRates(): Promise<FxRates> {
  const { data } = await api.get<FxRates>('/api/v1/fx/rates')
  return data
}
