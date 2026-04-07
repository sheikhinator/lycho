'use client'

import { use, useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Paperclip, X, Bot, User, FileText, Loader2, Mic, Volume2 } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'

interface Message {
  role: 'user' | 'assistant'
  content: string
  files?: { name: string; url: string; type: string }[]
}

interface AttachedFile {
  file: File
  preview?: string
}

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.json,.md'
const MAX_FILE_MB = 10

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [files, setFiles]           = useState<AttachedFile[]>([])
  const [sending, setSending]       = useState(false)
  const [agentName, setAgentName]   = useState('Agent')
  const [planError, setPlanError]   = useState(false)
  const [agentError, setAgentError] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [micError, setMicError]         = useState('')
  const bottomRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef   = useRef<any>(null)

  // Scroll to bottom on new message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Fetch agent name + set welcome message
  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then(r => r.json())
      .then(j => {
        if (j.data?.display_name) {
          setAgentName(j.data.display_name)
          setMessages([{ role: 'assistant', content: `Hi, I'm your ${j.data.display_name}. How can I help you today?` }])
        }
      })
      .catch(() => {})
  }, [agentId])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024)
    const withPreviews: AttachedFile[] = valid.map(file => {
      const af: AttachedFile = { file }
      if (file.type.startsWith('image/')) {
        af.preview = URL.createObjectURL(file)
      }
      return af
    })
    setFiles(prev => [...prev, ...withPreviews])
    e.target.value = ''
  }

  function removeFile(idx: number) {
    setFiles(prev => {
      const copy = [...prev]
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview!)
      copy.splice(idx, 1)
      return copy
    })
  }

  function startRecording() {
    setMicError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setMicError('Live transcription not supported in this browser — use Chrome')
      setTimeout(() => setMicError(''), 5000)
      return
    }
    const recognition = new SR()
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'

    recognition.onresult = (e: { results: SpeechRecognitionResultList }) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setInput(transcript)
    }

    recognition.onerror = (e: { error: string }) => {
      if (e.error === 'not-allowed') {
        setMicError('Microphone blocked — allow it in browser site settings')
      } else if (e.error === 'audio-capture') {
        setMicError('No microphone found')
      } else {
        setMicError(`Microphone error: ${e.error}`)
      }
      setTimeout(() => setMicError(''), 6000)
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  async function playResponse(text: string) {
    if (!voiceEnabled) return
    setIsPlaying(true)
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const audioBlob = await res.blob()
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch { setIsPlaying(false) }
  }

  const send = useCallback(async () => {
    if (sending || (!input.trim() && files.length === 0)) return
    const text = input.trim()
    const attachedFiles = [...files]
    setInput('')
    setFiles([])
    setSending(true)

    const userMsg: Message = {
      role: 'user',
      content: text,
      files: attachedFiles.map(af => ({ name: af.file.name, url: af.preview ?? '', type: af.file.type })),
    }
    setMessages(prev => [...prev, userMsg])
    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          message: text,
          channel: 'web',
          contact_identifier: 'dashboard-user'
        })
      })

      if (!res.ok) {
        let errorMsg = 'Error — please try again'
        try { const j = await res.json(); errorMsg = j?.error ?? j?.message ?? errorMsg } catch {}
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: errorMsg }; return u })
        setSending(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.searching === true)  setIsSearching(true)
              if (data.searching === false) setIsSearching(false)
              if (data.text) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + data.text
                  }
                  return updated
                })
              }
            } catch {}
          }
        }
      }
      // Play full response as audio if voice is enabled
      setMessages(prev => {
        const fullText = prev[prev.length - 1]?.content
        if (fullText) playResponse(fullText)
        return prev
      })
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: 'Network error — please try again.' }; return u })
    }
    setSending(false)
  }, [sending, input, files, agentId, voiceEnabled])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (planError) return (
    <div className="flex h-screen" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <Bot size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#C9A84C' }} />
            <h2 className="font-bebas text-2xl tracking-wider mb-2" style={{ color: '#C9A84C' }}>Active Plan Required</h2>
            <p className="text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>Chat with your agents is available on paid plans.</p>
            <Link href="/dashboard/billing" className="inline-block px-6 py-2.5 rounded-lg text-sm font-sans font-medium" style={{ background: '#C9A84C', color: '#070707' }}>
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  if (agentError) return (
    <div className="flex h-screen" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <p className="text-sm font-sans mb-4" style={{ color: '#6b6b6b' }}>Agent not found or not active.</p>
            <Link href="/dashboard/agents" className="text-sm font-sans underline" style={{ color: '#C9A84C' }}>Back to Agents</Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3 shrink-0" style={{ background: '#141414', borderBottom: '1px solid #2a2a2a' }}>
          <Link href={`/dashboard/agents/${agentId}?tab=overview`} className="flex items-center gap-1.5 text-sm font-sans" style={{ color: '#6b6b6b' }}>
            <ArrowLeft size={14} />
          </Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <Bot size={15} style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <p className="text-sm font-sans font-medium leading-tight" style={{ color: '#F0EBE1' }}>{agentName}</p>
            <p className="text-xs font-sans" style={{ color: '#4ade80' }}>● Active</p>
          </div>
          <div className="ml-auto text-xs font-sans" style={{ color: '#6b6b6b' }}>
            Supports images, PDFs, text files
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-3">
              <Bot size={40} style={{ color: '#C9A84C' }} />
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Send a message to start chatting with {agentName}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: msg.role === 'user' ? 'rgba(201,168,76,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${msg.role === 'user' ? 'rgba(201,168,76,0.25)' : 'rgba(74,222,128,0.2)'}` }}>
                {msg.role === 'user'
                  ? <User size={12} style={{ color: '#C9A84C' }} />
                  : <Bot size={12} style={{ color: '#4ade80' }} />}
              </div>

              <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* File attachments */}
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.files.map((f, fi) => (
                      <div key={fi} className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                        {f.type.startsWith('image/') && f.url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={f.url} alt={f.name} className="max-w-[220px] max-h-[180px] object-cover" />
                          : <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#1c1c1c' }}>
                              <FileText size={13} style={{ color: '#6b6b6b' }} />
                              <span className="text-xs font-sans truncate max-w-[140px]" style={{ color: '#F0EBE1' }}>{f.name}</span>
                            </div>
                        }
                      </div>
                    ))}
                  </div>
                )}

                {/* Text bubble */}
                {msg.content && (
                  <div className="px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed whitespace-pre-wrap"
                    style={{
                      background: msg.role === 'user' ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(201,168,76,0.2)' : '#2a2a2a'}`,
                      color: '#F0EBE1',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}>
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <Bot size={12} style={{ color: '#4ade80' }} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <Loader2 size={13} className="animate-spin" style={{ color: '#6b6b6b' }} />
                <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Web search indicator */}
        {isSearching && (
          <div className="px-4 lg:px-6 py-2 flex items-center gap-2 text-xs font-sans" style={{ color: '#C9A84C' }}>
            <span className="animate-spin inline-block" style={{ fontSize: 14 }}>⟳</span>
            Searching the web…
          </div>
        )}

        {/* File previews */}
        {files.length > 0 && (
          <div className="px-4 lg:px-6 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid #2a2a2a' }}>
            {files.map((af, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden group" style={{ border: '1px solid #2a2a2a' }}>
                {af.preview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={af.preview} alt={af.file.name} className="w-16 h-16 object-cover" />
                  : <div className="w-16 h-16 flex flex-col items-center justify-center gap-1" style={{ background: '#1c1c1c' }}>
                      <FileText size={16} style={{ color: '#6b6b6b' }} />
                      <span className="text-[9px] font-sans text-center px-1 truncate w-full" style={{ color: '#6b6b6b' }}>{af.file.name.slice(0, 12)}</span>
                    </div>
                }
                <button onClick={() => removeFile(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <X size={10} style={{ color: '#fff' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 lg:px-6 py-4 shrink-0" style={{ borderTop: files.length > 0 ? 'none' : '1px solid #2a2a2a' }}>
          <div className="flex items-end gap-2 rounded-xl px-4 py-3" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <input ref={fileRef} type="file" multiple accept={ACCEPTED} onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="flex-shrink-0 p-1 rounded transition-colors mb-0.5" style={{ color: '#6b6b6b' }}
              title="Attach file"
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}>
              <Paperclip size={17} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Shift+Enter for new line)"
              className="flex-1 bg-transparent text-sm font-sans outline-none resize-none"
              style={{ color: '#F0EBE1', maxHeight: '120px', overflowY: 'auto' }}
            />

            {/* Voice toggle */}
            <button
              type="button"
              onClick={() => setVoiceEnabled(v => !v)}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mb-0.5"
              style={{ background: voiceEnabled ? 'rgba(201,168,76,0.15)' : 'transparent', border: `1px solid ${voiceEnabled ? 'rgba(201,168,76,0.4)' : '#2a2a2a'}`, color: voiceEnabled ? '#C9A84C' : '#6b6b6b' }}
              title={voiceEnabled ? 'Voice on — click to disable' : 'Enable voice mode'}
            >
              {isPlaying ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
            </button>

            {/* Mic — click to start, click again to stop */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mb-0.5"
              style={{ background: isRecording ? '#ef4444' : 'transparent', border: `1px solid ${isRecording ? '#ef4444' : '#2a2a2a'}`, color: isRecording ? '#fff' : '#6b6b6b' }}
              title={isRecording ? 'Stop recording' : 'Click to speak'}
            >
              <Mic size={14} />
            </button>

            <button onClick={send} disabled={sending || (!input.trim() && files.length === 0)}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mb-0.5"
              style={{ background: sending || (!input.trim() && files.length === 0) ? '#2a2a2a' : '#C9A84C', cursor: sending ? 'not-allowed' : 'pointer' }}>
              {sending
                ? <Loader2 size={14} className="animate-spin" style={{ color: '#6b6b6b' }} />
                : <Send size={14} style={{ color: sending || (!input.trim() && files.length === 0) ? '#6b6b6b' : '#070707' }} />
              }
            </button>
          </div>
          {micError
            ? <p className="text-center mt-2 text-[10px] font-sans" style={{ color: '#ef4444' }}>{micError}</p>
            : <p className="text-center mt-2 text-[10px] font-sans" style={{ color: '#444' }}>
                Images · PDFs · TXT · CSV · JSON — max {MAX_FILE_MB}MB each
              </p>
          }
        </div>
      </div>
    </div>
  )
}
