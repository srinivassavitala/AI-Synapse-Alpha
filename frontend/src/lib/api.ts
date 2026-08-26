const API_BASE = '/api/v1';

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('synapseiq_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiResult<T>;

  if (!json.success) {
    throw new Error(json.error?.message ?? 'Request failed');
  }
  return json.data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User; workspaces: Workspace[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, fullName: string) =>
      request<{ token: string; user: User; workspace: Workspace }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }),
    me: () => request<User>('/auth/me'),
    updateProfile: (data: { fullName?: string; avatarUrl?: string | null }) =>
      request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  workspaces: {
    list: () => request<Workspace[]>('/workspaces'),
    get: (id: string) => request<WorkspaceDetail>(`/workspaces/${id}`),
    create: (name: string) => request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
    invite: (id: string, email: string, role: string) =>
      request(`/workspaces/${id}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  },
  documents: {
    list: (workspaceId: string, page = 1) =>
      request<Document[]>(`/workspaces/${workspaceId}/documents?page=${page}`),
    get: (id: string) => request<DocumentDetail>(`/documents/${id}`),
    search: (workspaceId: string, q: string) =>
      request<Document[]>(`/workspaces/${workspaceId}/documents/search?q=${encodeURIComponent(q)}`),
    upload: (workspaceId: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<Document>(`/workspaces/${workspaceId}/documents/upload`, { method: 'POST', body: form });
    },
    delete: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
  },
  conversations: {
    list: (workspaceId: string) => request<Conversation[]>(`/workspaces/${workspaceId}/conversations`),
    create: (workspaceId: string, title: string) =>
      request<Conversation>(`/workspaces/${workspaceId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    messages: (id: string) => request<Message[]>(`/conversations/${id}/messages`),
    send: (id: string, content: string) =>
      request<Message>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (id: string) => request(`/conversations/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    dashboard: (workspaceId: string) => request<AnalyticsDashboard>(`/workspaces/${workspaceId}/analytics`),
  },
  activity: {
    list: (workspaceId: string) => request<ActivityItem[]>(`/workspaces/${workspaceId}/activity`),
  },
  apiKeys: {
    list: (workspaceId: string) => request<ApiKey[]>(`/workspaces/${workspaceId}/api-keys`),
    create: (workspaceId: string, name: string) =>
      request<ApiKeyCreated>(`/workspaces/${workspaceId}/api-keys`, { method: 'POST', body: JSON.stringify({ name }) }),
    revoke: (id: string) => request(`/api-keys/${id}`, { method: 'DELETE' }),
  },
  integrations: {
    list: (workspaceId: string) => request<Integration[]>(`/workspaces/${workspaceId}/integrations`),
    connect: (workspaceId: string, provider: string) =>
      request(`/workspaces/${workspaceId}/integrations/${provider}/connect`, { method: 'POST' }),
    disconnect: (workspaceId: string, provider: string) =>
      request(`/workspaces/${workspaceId}/integrations/${provider}/disconnect`, { method: 'POST' }),
  },
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt?: string;
}

export interface WorkspaceDetail extends Workspace {
  ownerId: string;
  memberCount: number;
  members: { id: string; userId: string; role: string; fullName: string; email: string; joinedAt: string }[];
}

export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  chunkCount: number;
  summary: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends Document {
  chunks: { id: string; content: string; chunkIndex: number }[];
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  model?: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  summary: { totalDocuments: number; totalQueries: number; totalTokens: number; activeMembers: number };
  snapshots: { date: string; documentsProcessed: number; queriesExecuted: number; tokensConsumed: number; activeUsers: number }[];
}

export interface ActivityItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  userName: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface Integration {
  provider: string;
  status: string;
  connectedAt: string | null;
}
