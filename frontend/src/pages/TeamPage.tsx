import { useEffect, useState } from 'react';
import { UserPlus, Crown, Shield, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type WorkspaceDetail } from '../lib/api';

const roleIcons: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: UserPlus, viewer: Eye };

export function TeamPage() {
  const { activeWorkspace } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');

  const load = () => {
    if (activeWorkspace) api.workspaces.get(activeWorkspace.id).then(setWorkspace).catch(() => {});
  };

  useEffect(load, [activeWorkspace]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await api.workspaces.invite(activeWorkspace.id, email, role);
      setMessage('Invitation sent!');
      setEmail('');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to invite');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="text-slate-400">Manage workspace members and permissions</p>
      </div>

      <div className="card mb-8 p-6">
        <h2 className="mb-4 font-semibold text-white">Invite Member</h2>
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" className="input-field flex-1" required />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field w-full sm:w-40">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn-primary"><UserPlus className="h-4 w-4" /> Invite</button>
        </form>
        {message && <p className="mt-3 text-sm text-brand-400">{message}</p>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {workspace?.members.map((member) => {
              const Icon = roleIcons[member.role] ?? UserPlus;
              return (
                <tr key={member.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-sm font-bold text-brand-300">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{member.fullName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-300">
                      <Icon className="h-3 w-3" /> {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{new Date(member.joinedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
