import { useState, useCallback } from 'react'
import { sendChatMessage } from '../utils/api'

export function useChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Hi! I'm your AI security assistant. Scan a URL on the left, then ask me anything about it — or ask general cybersecurity questions.`
    }
  ])
  const [thinking, setThinking] = useState(false)

  const addBotMsg = (text) =>
    setMessages(prev => [...prev, { role: 'bot', text }])

  const addUserMsg = (text) =>
    setMessages(prev => [...prev, { role: 'user', text }])

  const send = useCallback(async (message, scanContext) => {
    addUserMsg(message)
    setThinking(true)

    // Build history for context (last 10 turns)
    const history = messages
      .slice(-10)
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))

    try {
      const data = await sendChatMessage({ message, scanContext, history })
      addBotMsg(data.reply)
    } catch (err) {
      addBotMsg('Sorry, I could not reach the AI service right now.')
    } finally {
      setThinking(false)
    }
  }, [messages])

  const announceScan = (result) => {
    const color = result.severity === 'safe' ? '🟢' : result.severity === 'warning' ? '🟡' : '🔴'
    addBotMsg(
      `${color} Scan complete for <strong>${result.rules?.meta?.host}</strong>. ` +
      `Risk score: <strong>${result.score}/100</strong> — <strong>${result.verdict}</strong>. ` +
      `What would you like to know?`
    )
  }

  return { messages, thinking, send, announceScan }
}
