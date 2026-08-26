import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Users, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api, type AnalyticsDashboard, type Document, type Conversation } from '../lib/api';

export function DashboardPage() {
  const { activeWorkspace, user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;
    api.analytics.dashboard(activeWorkspace.id).then(setAnalytics).catch(() => {});
    api.documents.list(activeWorkspace.id).then(setDocuments).catch(() => {});
    api.conversations.list(activeWorkspace.id).then(setConversations).catch(() => {});
  }, [activeWorkspace]);

  const stats = [
    { label: 'Documents', value: analytics?.summary.totalDocuments ?? 0, icon: FileText, color: 'text-blue-400' },
    { label: 'AI Queries', value: analytics?.summary.totalQueries ?? 0, icon: MessageSquare, color: 'text-violet-400' },
    { label: 'Tokens Used', value: (analytics?.summary.totalTokens ?? 0).toLocaleString(), icon: Zap, color: 'text-amber-400' },
    { label: 'Team Members', value: analytics?.summary.activeMembers ?? 0, icon: Users, color: 'text-emerald-400' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user?.fullName?.split(' ')[0]}. Here's what's happening in {activeWorkspace?.name}.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Query Activity</h2>
            <TrendingUp className="h-4 w-4 text-brand-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.snapshots ?? []}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Area type="monotone" dataKey="queriesExecuted" stroke="#6366f1" fill="url(#colorQueries)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/app/documents" className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
              Upload document <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/app/chat" className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
              Start AI chat <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/app/team" className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
              Invite team member <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/app/integrations" className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
              Connect integration <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Documents</h2>
            <Link to="/app/documents" className="text-sm text-brand-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {documents.slice(0, 5).map((doc) => (
              <Link key={doc.id} to={`/app/documents/${doc.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/50">
                <FileText className="h-4 w-4 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.status} · {doc.chunkCount} chunks</p>
                </div>
              </Link>
            ))}
            {documents.length === 0 && <p className="text-sm text-slate-500">No documents yet</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Conversations</h2>
            <Link to="/app/chat" className="text-sm text-brand-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => (
              <Link key={conv.id} to="/app/chat" className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/50">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{conv.title}</p>
                  <p className="text-xs text-slate-500">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
            {conversations.length === 0 && <p className="text-sm text-slate-500">No conversations yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
