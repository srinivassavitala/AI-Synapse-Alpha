import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MessageSquare, BarChart3, Users,
  Settings, Key, Plug, Activity, CreditCard, Building2, Brain, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/documents', icon: FileText, label: 'Documents' },
  { to: '/app/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/app/knowledge', icon: Brain, label: 'Knowledge Base' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/app/team', icon: Users, label: 'Team' },
  { to: '/app/workspaces', icon: Building2, label: 'Workspaces' },
  { to: '/app/activity', icon: Activity, label: 'Activity' },
  { to: '/app/integrations', icon: Plug, label: 'Integrations' },
  { to: '/app/api-keys', icon: Key, label: 'API Keys' },
  { to: '/app/billing', icon: CreditCard, label: 'Billing' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspaces, activeWorkspace, setActiveWorkspace, logout } = useAuth();
  const navigate = useNavigate();
  const [wsOpen, setWsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950">
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">SynapseIQ</h1>
            <p className="text-xs text-slate-500">Knowledge Intelligence</p>
          </div>
        </div>

        <div className="relative border-b border-slate-800 px-3 py-3">
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-800/60"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-200">{activeWorkspace?.name ?? 'Select workspace'}</p>
              <p className="truncate text-xs capitalize text-slate-500">{activeWorkspace?.plan ?? ''} plan</p>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${wsOpen ? 'rotate-180' : ''}`} />
          </button>
          {wsOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setActiveWorkspace(ws); setWsOpen(false); }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${ws.id === activeWorkspace?.id ? 'text-brand-400' : 'text-slate-300'}`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/30 text-xs font-bold text-brand-300">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="text-slate-500 hover:text-slate-300" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
