import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

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
