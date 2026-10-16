'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { api } from '../../lib/api';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Send,
  User as UserIcon,
  Cpu,
} from 'lucide-react';

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
  { id: 'gemini-flash-latest', name: 'Gemini Flash (Recommended)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash-latest');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
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
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      const list = res.data.data.sessions;
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0]._id);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      setMessages(res.data.data.messages || []);
    } catch (err) {
      console.error('Error loading session messages:', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Advisory Session' });
      const newSession = res.data.data.session;
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession._id);
      setMessages([]);
    } catch (err) {
      console.error('Error creating session:', err);
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
    } catch (err) {
      console.error('Error deleting session:', err);
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
    } catch (err) {
      console.error('Error renaming session:', err);
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const res = await api.post('/chat/sessions', { title: input.slice(0, 25) });
      const newSession = res.data.data.session;
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession._id);
      targetSessionId = newSession._id;
    }

    const userText = input;
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = { role: 'user', content: userText };
    const botPlaceholder: ChatMessage = { role: 'model', content: '' };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${apiBase}/chat/sessions/${targetSessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText, model: selectedModel }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed, falling back');
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
      // Fallback to non-streaming if stream drops
      try {
        const res = await api.post(`/chat/sessions/${targetSessionId}/messages`, {
          message: userText,
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

  return (
    <AppShell>
      <div className="h-[calc(100vh-7.5rem)] flex rounded border border-neutral-200 bg-white overflow-hidden">
        <aside className="w-72 border-r border-neutral-200 flex flex-col bg-neutral-50/50">
          <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-700" /> Sessions
            </h2>
            <button
              onClick={handleCreateSession}
              className="p-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {sessions.map((s) => {
              const isActive = s._id === activeSessionId;
              return (
                <div
                  key={s._id}
                  onClick={() => setActiveSessionId(s._id)}
                  className={`group flex items-center justify-between p-2 rounded text-xs cursor-pointer ${
                    isActive
                      ? 'bg-neutral-200 text-neutral-900 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1.5">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    {editingTitleId === s._id ? (
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onBlur={() => handleRename(s._id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(s._id)}
                        autoFocus
                        className="bg-white border border-neutral-400 px-1 py-0.5 rounded text-xs w-full text-neutral-900"
                      />
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(s._id);
                        setEditTitleText(s.title);
                      }}
                      className="p-1 hover:text-neutral-900"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, s._id)}
                      className="p-1 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-white">
          <div className="p-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/30">
            <div className="text-xs font-medium text-neutral-800 truncate">
              {sessions.find((s) => s._id === activeSessionId)?.title || 'Advisory Thread'}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-white border border-neutral-300 rounded px-2 py-1 text-neutral-800 focus:outline-none focus:border-neutral-900"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-8 h-8 bg-neutral-100 text-neutral-700 rounded flex items-center justify-center mb-2">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-sm">Advisory Console</h3>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  Fast streaming responses with contextual conversation memory and customizable models.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs ${
                        isUser ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-3 h-3" /> : 'CF'}
                    </div>
                    <div
                      className={`max-w-xl px-3.5 py-2.5 rounded text-xs leading-relaxed ${
                        isUser
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content || '...'}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-neutral-300 rounded text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded text-xs flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
