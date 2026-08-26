import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User, type Workspace } from '../lib/api';

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem('synapseiq_workspace', ws.id);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
      const ws = await api.workspaces.list();
      setWorkspaces(ws);
      const savedId = localStorage.getItem('synapseiq_workspace');
      const active = ws.find((w) => w.id === savedId) ?? ws[0] ?? null;
      if (active) setActiveWorkspace(active);
    } catch {
      localStorage.removeItem('synapseiq_token');
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    }
  }, [setActiveWorkspace]);

  useEffect(() => {
    const token = localStorage.getItem('synapseiq_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await api.auth.login(email, password);
    localStorage.setItem('synapseiq_token', result.token);
    setUser(result.user);
    setWorkspaces(result.workspaces);
    if (result.workspaces[0]) setActiveWorkspace(result.workspaces[0]);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const result = await api.auth.register(email, password, fullName);
    localStorage.setItem('synapseiq_token', result.token);
    setUser(result.user);
    setWorkspaces([result.workspace]);
    setActiveWorkspace(result.workspace);
  };

  const logout = () => {
    localStorage.removeItem('synapseiq_token');
    localStorage.removeItem('synapseiq_workspace');
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceState(null);
  };

  return (
    <AuthContext.Provider value={{ user, workspaces, activeWorkspace, isLoading, login, register, logout, setActiveWorkspace, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
