import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const api = axios.create({ baseURL })

export async function scanURL(url) {
  const { data } = await api.post('/scan', { url })
  return data
}

export async function sendChatMessage({ message, scanContext, history }) {
  const { data } = await api.post('/chat', { message, scanContext, history })
  return data
}

export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}
