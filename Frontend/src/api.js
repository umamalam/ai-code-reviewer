import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export const api = axios.create({ baseURL: API_BASE })

export async function getReview(files) {
  const { data } = await api.post('/ai/get-review', { files })
  return data
}

export async function getMetricsSummary() {
  const { data } = await api.get('/metrics/summary')
  return data
}

export async function getMetricsHistory(days = 30) {
  const { data } = await api.get('/metrics/history', { params: { days } })
  return data
}

export async function getRecentReviews(limit = 10) {
  const { data } = await api.get('/metrics/recent', { params: { limit } })
  return data
}
