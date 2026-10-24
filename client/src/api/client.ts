import axios from 'axios'
import { supabase } from '@/api/supabaseClient'

export const api = axios.create()

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
