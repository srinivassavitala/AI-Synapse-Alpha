import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.auth.updateProfile({ fullName });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your account preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <form onSubmit={save} className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input value={user?.email ?? ''} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Role</label>
              <input value={user?.role ?? ''} disabled className="input-field capitalize opacity-60" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-6">
            <Save className="h-4 w-4" /> {saved ? 'Saved!' : 'Save changes'}
          </button>
        </form>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Notifications</h2>
          <div className="space-y-3">
            {['Email digest (weekly)', 'Document processing alerts', 'Team activity notifications', 'Billing reminders'].map((label) => (
              <label key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand-600 focus:ring-brand-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Danger Zone</h2>
          <p className="mb-4 text-sm text-slate-400">Permanently delete your account and all associated data.</p>
          <button className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
