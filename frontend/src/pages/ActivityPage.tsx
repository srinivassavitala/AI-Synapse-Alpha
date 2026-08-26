import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type ActivityItem } from '../lib/api';

export function ActivityPage() {
  const { activeWorkspace } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (activeWorkspace) api.activity.list(activeWorkspace.id).then(setItems).catch(() => {});
  }, [activeWorkspace]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-slate-400">Audit trail of all workspace actions</p>
      </div>

      <div className="card divide-y divide-slate-800/60">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 px-6 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">
                <span className="font-medium">{item.userName}</span>{' '}
                <span className="text-slate-400">{item.action.replace('.', ' ')}</span>
              </p>
              <p className="text-xs text-slate-500">{item.resourceType} · {item.resourceId.slice(0, 8)}...</p>
            </div>
            <time className="shrink-0 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-500">No activity recorded yet</div>
        )}
      </div>
    </div>
  );
}
