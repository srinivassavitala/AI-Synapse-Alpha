import { useState } from 'react';
import { Building2, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function WorkspacesPage() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const ws = await api.workspaces.create(name);
      setActiveWorkspace(ws);
      setName('');
      window.location.reload();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
        <p className="text-slate-400">Manage your workspaces and switch between them</p>
      </div>

      <form onSubmit={create} className="card mb-8 flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">New workspace name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="My Team Workspace" required />
        </div>
        <button type="submit" disabled={creating} className="btn-primary">
          <Plus className="h-4 w-4" /> {creating ? 'Creating...' : 'Create workspace'}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <div key={ws.id} className={`card p-6 ${ws.id === activeWorkspace?.id ? 'border-brand-500/50 ring-1 ring-brand-500/20' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                <Building2 className="h-5 w-5 text-brand-400" />
              </div>
              {ws.id === activeWorkspace?.id && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-300">
                  <Check className="h-3 w-3" /> Active
                </span>
              )}
            </div>
            <h3 className="mt-4 font-semibold text-white">{ws.name}</h3>
            <p className="text-sm text-slate-500">{ws.slug}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs capitalize text-slate-400">{ws.plan} plan</span>
              {ws.id !== activeWorkspace?.id && (
                <button onClick={() => setActiveWorkspace(ws)} className="text-sm text-brand-400 hover:underline">Switch</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
