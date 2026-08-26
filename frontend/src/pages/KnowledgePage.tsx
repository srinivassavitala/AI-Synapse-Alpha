import { useEffect, useState } from 'react';
import { Brain, Search, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type Document } from '../lib/api';

export function KnowledgePage() {
  const { activeWorkspace } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);

  useEffect(() => {
    if (activeWorkspace) api.documents.list(activeWorkspace.id).then(setDocuments).catch(() => {});
  }, [activeWorkspace]);

  const handleSearch = async () => {
    if (!activeWorkspace || !query.trim()) return;
    const res = await api.documents.search(activeWorkspace.id, query);
    setResults(res);
  };

  const indexed = documents.filter((d) => d.status === 'indexed');
  const totalChunks = documents.reduce((s, d) => s + d.chunkCount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-slate-400">Explore and search your indexed knowledge</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-brand-400" />
            <div>
              <p className="text-2xl font-bold text-white">{indexed.length}</p>
              <p className="text-sm text-slate-400">Indexed documents</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-2xl font-bold text-white">{totalChunks}</p>
              <p className="text-sm text-slate-400">Total chunks</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">RAG</p>
              <p className="text-sm text-slate-400">Retrieval engine active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-8 p-6">
        <h2 className="mb-4 font-semibold text-white">Semantic Search</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search across all documents..."
              className="input-field pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">Search</button>
        </div>
      </div>

      {(results.length > 0 ? results : indexed).map((doc) => (
        <div key={doc.id} className="card mb-4 p-5">
          <h3 className="font-semibold text-white">{doc.title}</h3>
          {doc.summary && <p className="mt-2 text-sm text-slate-400 line-clamp-2">{doc.summary}</p>}
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span>{doc.chunkCount} chunks</span>
            <span>{doc.tags.join(', ') || 'No tags'}</span>
            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
