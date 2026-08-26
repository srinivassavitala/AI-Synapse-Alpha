import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Search, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type Document } from '../lib/api';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle; color: string }> = {
    indexed: { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10' },
    processing: { icon: Clock, color: 'text-amber-400 bg-amber-400/10' },
    pending: { icon: Clock, color: 'text-slate-400 bg-slate-400/10' },
    failed: { icon: AlertCircle, color: 'text-red-400 bg-red-400/10' },
  };
  const { icon: Icon, color } = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

export function DocumentsPage() {
  const { activeWorkspace } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!activeWorkspace) return;
    if (search) {
      api.documents.search(activeWorkspace.id, search).then(setDocuments).catch(() => {});
    } else {
      api.documents.list(activeWorkspace.id).then(setDocuments).catch(() => {});
    }
  };

  useEffect(load, [activeWorkspace, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    setUploading(true);
    try {
      await api.documents.upload(activeWorkspace.id, file);
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await api.documents.delete(id);
    load();
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400">Upload and manage your knowledge base documents</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.csv" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload document'}
          </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Document</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Chunks</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-800/30">
                <td className="px-6 py-4">
                  <Link to={`/app/documents/${doc.id}`} className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-brand-400" />
                    <div>
                      <p className="font-medium text-slate-200">{doc.title}</p>
                      <p className="text-xs text-slate-500">{doc.filename}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                <td className="px-6 py-4 text-sm text-slate-400">{formatBytes(doc.sizeBytes)}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{doc.chunkCount}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(doc.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-700" />
            <p className="text-slate-400">No documents yet. Upload your first document to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
