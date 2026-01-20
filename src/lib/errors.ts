import axios from 'axios'

type ErrorPayload = {
  detail?: string
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed') {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    const data = error.response?.data
    if (typeof data === 'string' && data.trim()) {
      return data
    }
    if (data?.detail) {
      return data.detail
    }
    if (data?.message) {
      return data.message
    }
    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
