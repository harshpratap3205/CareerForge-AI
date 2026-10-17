'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { api, getValidAccessToken, refreshAccessToken } from '../../lib/api';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Send,
  Cpu,
  Sparkles,
  Menu,
  X,
  Bot,
  CornerDownLeft,
} from 'lucide-react';
import clsx from 'clsx';

interface ChatSession {
  _id: string;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  _id?: string;
  role: 'user' | 'model';
  content: string;
  createdAt?: string;
}

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'Groq GPT-OSS 120B', badge: 'Ultra Fast' },
  { id: 'qwen/qwen3.8-27b', name: 'Groq Qwen 27B', badge: 'Accurate' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash', badge: 'Google' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Latest' },
];

const SUGGESTED_PROMPTS = [
  'How do I prepare for a Senior Full-Stack Technical Assessment?',
  'Review key system design trade-offs between Redis and MongoDB',
  'What are common behavioral interview pitfalls for 3+ YOE developers?',
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-oss-120b');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      const list = res.data.data.sessions;
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0]._id);
      }
    } catch {
      // Ignore if initial fetch fails
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      setMessages(res.data.data.messages || []);
    } catch {
      // Ignore if session load fails
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Advisory Thread' });
      const newSession = res.data.data.session;
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession._id);
      setMessages([]);
      setShowMobileSessions(false);
    } catch {
      // Ignore creation error
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/sessions/${id}`);
      const updated = sessions.filter((s) => s._id !== id);
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated.length > 0 ? updated[0]._id : null);
        setMessages([]);
      }
    } catch {
      // Ignore deletion error
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitleText.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await api.patch(`/chat/sessions/${id}`, { title: editTitleText });
      setSessions(
        sessions.map((s) => (s._id === id ? { ...s, title: editTitleText } : s))
      );
    } catch {
      // Ignore rename error
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const res = await api.post('/chat/sessions', { title: text.slice(0, 28) });
      const newSession = res.data.data.session;
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession._id);
      targetSessionId = newSession._id;
    }

    setInput('');
    setSending(true);

    const userMsg: ChatMessage = { role: 'user', content: text };
    const botPlaceholder: ChatMessage = { role: 'model', content: '' };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);

    try {
      let token = await getValidAccessToken();
      const apiBase = process.env.Server_API_URL || 'http://localhost:5000/api';

      let response = await fetch(`${apiBase}/chat/sessions/${targetSessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, model: selectedModel }),
      });

      if (response.status === 401) {
        token = await refreshAccessToken();
        response = await fetch(`${apiBase}/chat/sessions/${targetSessionId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text, model: selectedModel }),
        });
      }

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'model',
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch {
      try {
        const res = await api.post(`/chat/sessions/${targetSessionId}/messages`, {
          message: text,
          model: selectedModel,
        });
        const botMsg = res.data.data.botMsg;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = botMsg;
          return updated;
        });
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'model',
            content: 'Unable to connect to advisory service. Please check your network.',
          };
          return updated;
        });
      }
    } finally {
      setSending(false);
      fetchSessions();
    }
  };

  const activeSessionTitle =
    sessions.find((s) => s._id === activeSessionId)?.title || 'Advisory Thread';

  return (
    <AppShell>
      <div className="h-[calc(100vh-8.5rem)] flex rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs relative">
        {showMobileSessions && (
          <div
            onClick={() => setShowMobileSessions(false)}
            className="fixed inset-0 bg-neutral-900/30 z-30 md:hidden backdrop-blur-2xs"
            aria-hidden="true"
          />
        )}

        <aside
          className={clsx(
            'flex flex-col bg-neutral-50/60 border-r border-neutral-200 shrink-0 transition-transform duration-200 ease-in-out',
            'w-68 sm:w-72',
            showMobileSessions
              ? 'absolute inset-y-0 left-0 shadow-xl md:shadow-none md:static translate-x-0 z-20'
              : 'hidden md:flex z-0'
          )}
        >
          <div className="p-3.5 border-b border-neutral-200 flex items-center justify-between bg-white">
            <h2 className="font-bold text-neutral-800 text-xs flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
              <span>Chat Threads</span>
              <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded-full text-neutral-600 font-semibold">
                {sessions.length}
              </span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateSession}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs transition shadow-2xs flex items-center gap-1"
                title="New Chat Thread"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {showMobileSessions && (
                <button
                  onClick={() => setShowMobileSessions(false)}
                  className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400">
                No active threads. Click + to begin.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s._id === activeSessionId;
                return (
                  <div
                    key={s._id}
                    onClick={() => {
                      setActiveSessionId(s._id);
                      setShowMobileSessions(false);
                    }}
                    className={clsx(
                      'group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition',
                      isActive
                        ? 'bg-neutral-900 text-white font-medium shadow-xs'
                        : 'text-neutral-700 hover:bg-neutral-200/60'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1.5">
                      <MessageSquare
                        className={clsx(
                          'w-3.5 h-3.5 shrink-0',
                          isActive ? 'text-neutral-300' : 'text-neutral-400'
                        )}
                      />
                      {editingTitleId === s._id ? (
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onBlur={() => handleRename(s._id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(s._id)}
                          autoFocus
                          className="bg-white border border-neutral-400 px-1.5 py-0.5 rounded text-xs w-full text-neutral-900"
                        />
                      ) : (
                        <span className="truncate">{s.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(s._id);
                          setEditTitleText(s.title);
                        }}
                        className={clsx(
                          'p-1 rounded',
                          isActive ? 'hover:text-white' : 'hover:text-neutral-900'
                        )}
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, s._id)}
                        className="p-1 hover:text-rose-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="p-3 sm:px-5 sm:py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/40 gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <button
                onClick={() => setShowMobileSessions(true)}
                className="md:hidden p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shrink-0"
                title="View Threads"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="overflow-hidden">
                <h2 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {activeSessionTitle}
                </h2>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Streaming Career Advisor
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-[11px] sm:text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-neutral-800 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 shadow-2xs max-w-[140px] sm:max-w-none"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm sm:text-base">
                  AI Career Advisory Console
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-md leading-relaxed">
                  Real-time streaming responses powered by Groq & Gemini with persistent session memory and career coaching.
                </p>

                <div className="mt-6 w-full space-y-2">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-left">
                    Suggested Topics:
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-left">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="p-2.5 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-xs text-neutral-700 transition shadow-2xs flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate mr-2">{prompt}</span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === 'user';
                const isLatestBot = !isUser && idx === messages.length - 1 && sending;

                if (isUser) {
                  return (
                    <div key={idx} className="flex justify-end my-1">
                      <div className="max-w-[85%] sm:max-w-xl bg-neutral-100 hover:bg-neutral-100/90 text-neutral-900 rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs">
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex items-start gap-3 my-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>

                    <div className="flex-1 max-w-[90%] sm:max-w-3xl pt-1 text-xs sm:text-[13px] text-neutral-800 leading-relaxed">
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                        {isLatestBot && (
                          <span className="inline-block w-1.5 h-3.5 bg-indigo-600 animate-pulse ml-1 align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 border-t border-neutral-200 bg-white"
          >
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10 transition shadow-2xs">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about resume tips, interview prep, salary negotiation..."
                className="flex-1 bg-transparent py-1.5 text-xs sm:text-[13px] text-neutral-900 placeholder-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
