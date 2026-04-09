import { useState, useCallback } from 'react'
import { scanURL } from '../utils/api'

export function useScan() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const scan = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    try {
      const data = await scanURL(url)
      setResult(data)
      return data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Scan failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, scan }
}
