import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Zap, Shield, BarChart3, MessageSquare, FileSearch, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">SynapseIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started free</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/30 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
            <Zap className="h-4 w-4" /> Enterprise AI Knowledge Platform
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Turn documents into<br />
            <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">intelligent decisions</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
            SynapseIQ ingests your knowledge base, indexes it with AI, and gives your team instant answers
            with source citations. Built for teams who can't afford to lose institutional knowledge.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register" className="btn-primary px-8 py-3 text-base">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base">View demo</Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Demo account: demo@synapseiq.io / demo1234</p>
        </div>
      </section>

      <section className="border-t border-slate-800/60 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white">Everything your team needs</h2>
          <p className="mb-16 text-center text-slate-400">From document ingestion to AI-powered insights</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileSearch, title: 'Smart Ingestion', desc: 'Upload PDFs, docs, and markdown. Auto-chunked and indexed with embeddings.' },
              { icon: MessageSquare, title: 'RAG Chat', desc: 'Ask questions in natural language. Get answers grounded in your documents.' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track usage, token consumption, and team engagement across workspaces.' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Role-based access, API keys, audit logs, and workspace isolation.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800/60 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Simple, transparent pricing</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Free', price: '$0', features: ['1 workspace', '100 documents', '1,000 queries/mo', 'Basic analytics'] },
              { name: 'Pro', price: '$49', features: ['5 workspaces', 'Unlimited documents', '50,000 queries/mo', 'API access', 'Integrations'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Unlimited everything', 'SSO & SAML', 'Dedicated support', 'Custom SLA'] },
            ].map((plan) => (
              <div key={plan.name} className={`card p-6 ${plan.highlight ? 'border-brand-500/50 ring-1 ring-brand-500/30' : ''}`}>
                {plan.highlight && <span className="mb-3 inline-block rounded-full bg-brand-600/20 px-3 py-0.5 text-xs font-medium text-brand-300">Most popular</span>}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-3xl font-extrabold text-white">{plan.price}<span className="text-sm font-normal text-slate-500">{plan.price !== 'Custom' ? '/mo' : ''}</span></p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        &copy; 2026 SynapseIQ. All rights reserved.
      </footer>
    </div>
  );
}
