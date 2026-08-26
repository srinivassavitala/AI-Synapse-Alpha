import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Plus, Send, Trash2, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type Conversation, type Message } from '../lib/api';

export function ChatPage() {
  const { activeWorkspace } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    if (!activeWorkspace) return;
    api.conversations.list(activeWorkspace.id).then(setConversations).catch(() => {});
  };

  useEffect(loadConversations, [activeWorkspace]);

  useEffect(() => {
    if (activeConv) {
      api.conversations.messages(activeConv.id).then(setMessages).catch(() => {});
    }
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConversation = async () => {
    if (!activeWorkspace) return;
    const conv = await api.conversations.create(activeWorkspace.id, 'New Conversation');
    setConversations((prev) => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    setMessages((prev) => [...prev, { id: 'temp', role: 'user', content, createdAt: new Date().toISOString() }]);

    try {
      const reply = await api.conversations.send(activeConv.id, content);
      setMessages((prev) => [...prev.filter((m) => m.id !== 'temp'), { id: 'temp-user', role: 'user', content, createdAt: new Date().toISOString() }, reply]);
      loadConversations();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== 'temp'));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    await api.conversations.delete(id);
    if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
    loadConversations();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -mx-8 -my-8">
      <div className="flex w-72 flex-col border-r border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="font-semibold text-white">Conversations</h2>
          <button onClick={createConversation} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer ${
                activeConv?.id === conv.id ? 'bg-brand-600/15 text-brand-300' : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <button onClick={() => setActiveConv(conv)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
              <button onClick={() => deleteConversation(conv.id)} className="hidden text-slate-600 hover:text-red-400 group-hover:block">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No conversations yet</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {activeConv ? (
          <>
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="font-semibold text-white">{activeConv.title}</h2>
              <p className="text-xs text-slate-500">Model: {activeConv.model}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((msg, i) => (
                  <div key={msg.id + i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/20">
                        <Bot className="h-4 w-4 text-brand-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-800/80 text-slate-200'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <p className="mt-2 text-xs opacity-60">{msg.sources.length} source(s) referenced</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700">
                        <User className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20">
                      <Bot className="h-4 w-4 text-brand-400" />
                    </div>
                    <div className="rounded-xl bg-slate-800/80 px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-slate-800 px-6 py-4">
              <div className="mx-auto flex max-w-3xl gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask anything about your knowledge base..."
                  className="input-field flex-1"
                  disabled={sending}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()} className="btn-primary px-4">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-slate-700" />
            <h2 className="text-lg font-semibold text-white">Start a conversation</h2>
            <p className="mb-6 mt-2 max-w-md text-sm text-slate-400">Ask questions about your documents. SynapseIQ uses RAG to ground answers in your knowledge base.</p>
            <button onClick={createConversation} className="btn-primary"><Plus className="h-4 w-4" /> New conversation</button>
          </div>
        )}
      </div>
    </div>
  );
}
