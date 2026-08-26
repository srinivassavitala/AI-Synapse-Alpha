import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api, type AnalyticsDashboard } from '../lib/api';

export function AnalyticsPage() {
  const { activeWorkspace } = useAuth();
  const [data, setData] = useState<AnalyticsDashboard | null>(null);

  useEffect(() => {
    if (activeWorkspace) api.analytics.dashboard(activeWorkspace.id).then(setData).catch(() => {});
  }, [activeWorkspace]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400">Monitor usage, performance, and team engagement</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Documents', value: data?.summary.totalDocuments ?? 0 },
          { label: 'Total Queries', value: data?.summary.totalQueries ?? 0 },
          { label: 'Tokens Consumed', value: (data?.summary.totalTokens ?? 0).toLocaleString() },
          { label: 'Active Members', value: data?.summary.activeMembers ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Daily Queries</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.snapshots ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="queriesExecuted" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Token Consumption</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.snapshots ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="tokensConsumed" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
