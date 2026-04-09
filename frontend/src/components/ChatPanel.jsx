import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

const QUICK_ASKS = [
  'What are the top signs of a phishing URL?',
  'How do attackers use subdomains to trick people?',
  'I clicked a suspicious link, what should I do?',
  'What is URL homoglyph attack?',
]

export default function ChatPanel({ messages, thinking, onSend, scanContext }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = () => {
    const q = input.trim()
    if (!q || thinking) return
    setInput('')
    onSend(q, scanContext)
  }

  return (
    <div className="flex flex-col h-full bg-bg-2">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <MessageSquare className="w-4 h-4 text-accent" />
        <div>
          <div className="text-sm font-semibold">Security Assistant</div>
          <div className="text-[11px] text-gray-500">Ask anything about URLs & phishing</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'self-end bg-accent text-white rounded-br-sm'
                : 'self-start bg-bg-3 text-gray-200 border border-border rounded-bl-sm'
            }`}
            dangerouslySetInnerHTML={{ __html:
              m.role === 'bot'
                ? m.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                : m.text
            }}
          />
        ))}

        {thinking && (
          <div className="self-start flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bg-3 border border-border text-sm text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick asks */}
      <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
        {QUICK_ASKS.map(q => (
          <button
            key={q}
            onClick={() => onSend(q, scanContext)}
            className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-bg-3
                       text-gray-500 hover:border-accent hover:text-accent transition-colors"
          >
            {q.length > 32 ? q.slice(0, 30) + '…' : q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 px-4 py-3 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about this URL or any security question…"
          className="flex-1 px-3 py-2.5 rounded-xl bg-bg-3 border border-border-2 text-sm text-gray-200
                     placeholder:text-gray-600 outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={thinking || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-blue-500
                     disabled:bg-bg-4 disabled:text-gray-600 transition-colors"
        >
          {thinking
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )
}
