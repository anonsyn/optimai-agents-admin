import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { getApiErrorMessage } from './errors'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const STORAGE_KEY = 'optimai_agents_admin_token'

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    const { response } = error

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    } else {
      toast.error(getApiErrorMessage(error, 'An error occurred'))
    }

    return Promise.reject(error)
  }
)
