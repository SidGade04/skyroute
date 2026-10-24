import axios from 'axios'
import { api } from '@/api/client'

export type UserProfile = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  provider: string | null
  createdAt: string
}

function failure(e: unknown) {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as { message?: string } | undefined
    return new Error(body?.message || e.message)
  }
  return e instanceof Error ? e : new Error('Request failed')
}

export async function syncUser(): Promise<UserProfile> {
  try {
    const { data } = await api.post<UserProfile>('/api/v1/users/sync')
    return data
  } catch (e) {
    throw failure(e)
  }
}

export async function updateUser(body: {
  email: string | null
  phone: string | null
}): Promise<UserProfile> {
  try {
    const { data } = await api.patch<UserProfile>('/api/v1/users/me', body)
    return data
  } catch (e) {
    throw failure(e)
  }
}
