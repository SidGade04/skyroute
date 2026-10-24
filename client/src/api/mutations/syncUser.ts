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

export async function syncUser(): Promise<UserProfile> {
  try {
    const { data } = await api.post<UserProfile>('/api/v1/users/sync')
    return data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data as { message?: string } | undefined
      throw new Error(body?.message || e.message)
    }
    throw e
  }
}
