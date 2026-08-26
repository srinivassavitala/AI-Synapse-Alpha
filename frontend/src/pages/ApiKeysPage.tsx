import { useEffect, useState } from 'react';
import { Key, Plus, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type ApiKey } from '../lib/api';

export function ApiKeysPage() {
  const { activeWorkspace } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = () => {
    if (activeWorkspace) api.apiKeys.list(activeWorkspace.id).then(setKeys).catch(() => {});
  };

  useEffect(load, [activeWorkspace]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    const result = await api.apiKeys.create(activeWorkspace.id, name);
    setNewKey(result.key);
    setName('');
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await api.apiKeys.revoke(id);
    load();
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <p className="text-slate-400">Manage programmatic access to your workspace</p>
      </div>

      {newKey && (
        <div className="card mb-6 border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-300">Copy your API key now</p>
              <p className="mt-1 text-sm text-slate-400">This key will not be shown again.</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-emerald-400">{newKey}</code>
                <button onClick={() => copy(newKey)} className="btn-secondary px-3"><Copy className="h-4 w-4" /></button>
              </div>
            </div>
            <button onClick={() => setNewKey(null)} className="text-slate-500 hover:text-white">&times;</button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="card mb-8 flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Key name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Production API" required />
        </div>
        <button type="submit" className="btn-primary"><Plus className="h-4 w-4" /> Generate key</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Key</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Last used</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-slate-200">{key.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-400">{key.keyPrefix}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(key.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-6 py-4">
                  <button onClick={() => revoke(key.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {keys.length === 0 && <div className="py-12 text-center text-sm text-slate-500">No API keys yet</div>}
      </div>
    </div>
  );
}
