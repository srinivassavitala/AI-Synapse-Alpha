import { useEffect, useState } from 'react';
import { Plug, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type Integration } from '../lib/api';

const providerInfo: Record<string, { name: string; desc: string; color: string }> = {
  slack: { name: 'Slack', desc: 'Get AI answers directly in Slack channels', color: 'bg-[#4A154B]/30 text-[#E01E5A]' },
  notion: { name: 'Notion', desc: 'Sync pages and databases automatically', color: 'bg-slate-700/50 text-slate-200' },
  google_drive: { name: 'Google Drive', desc: 'Import documents from Drive folders', color: 'bg-blue-600/20 text-blue-400' },
  github: { name: 'GitHub', desc: 'Index README files and wiki pages', color: 'bg-slate-700/50 text-slate-200' },
};

export function IntegrationsPage() {
  const { activeWorkspace } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const load = () => {
    if (activeWorkspace) api.integrations.list(activeWorkspace.id).then(setIntegrations).catch(() => {});
  };

  useEffect(load, [activeWorkspace]);

  const toggle = async (provider: string, connected: boolean) => {
    if (!activeWorkspace) return;
    setLoading(provider);
    try {
      if (connected) {
        await api.integrations.disconnect(activeWorkspace.id, provider);
      } else {
        await api.integrations.connect(activeWorkspace.id, provider);
      }
      load();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400">Connect external tools to enrich your knowledge base</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => {
          const info = providerInfo[integration.provider] ?? { name: integration.provider, desc: '', color: 'bg-slate-800' };
          const connected = integration.status === 'connected';
          return (
            <div key={integration.provider} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${info.color}`}>
                    <Plug className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{info.name}</h3>
                    <p className="text-sm text-slate-400">{info.desc}</p>
                  </div>
                </div>
                {connected ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium capitalize ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {integration.status}
                </span>
                <button
                  onClick={() => toggle(integration.provider, connected)}
                  disabled={loading === integration.provider}
                  className={connected ? 'btn-secondary text-xs' : 'btn-primary text-xs'}
                >
                  {loading === integration.provider ? '...' : connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
