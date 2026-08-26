import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Tag } from 'lucide-react';
import { api, type DocumentDetail } from '../lib/api';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);

  useEffect(() => {
    if (id) api.documents.get(id).then(setDoc).catch(() => {});
  }, [id]);

  if (!doc) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/app/documents" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to documents
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20">
          <FileText className="h-6 w-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{doc.title}</h1>
          <p className="text-slate-400">{doc.filename} · {doc.chunkCount} chunks · {doc.status}</p>
          {doc.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {doc.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {doc.summary && (
        <div className="card mb-6 p-6">
          <h2 className="mb-3 font-semibold text-white">AI Summary</h2>
          <p className="text-sm leading-relaxed text-slate-300">{doc.summary}</p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-white">Document Chunks ({doc.chunks.length})</h2>
        <div className="space-y-4">
          {doc.chunks.map((chunk) => (
            <div key={chunk.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Chunk #{chunk.chunkIndex + 1}</p>
              <p className="text-sm leading-relaxed text-slate-300">{chunk.content}</p>
            </div>
          ))}
          {doc.chunks.length === 0 && <p className="text-sm text-slate-500">No chunks indexed yet</p>}
        </div>
      </div>
    </div>
  );
}
