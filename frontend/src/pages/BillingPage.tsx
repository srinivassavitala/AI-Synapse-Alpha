import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    name: 'Free',
    price: 0,
    current: false,
    features: ['1 workspace', '100 documents', '1,000 queries/month', 'Basic analytics'],
  },
  {
    name: 'Pro',
    price: 49,
    current: true,
    features: ['5 workspaces', 'Unlimited documents', '50,000 queries/month', 'API access', 'All integrations', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: null,
    current: false,
    features: ['Unlimited everything', 'SSO / SAML', 'Dedicated support', 'Custom SLA', 'On-premise option'],
  },
];

export function BillingPage() {
  const { activeWorkspace } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400">Manage your subscription and billing details</p>
      </div>

      <div className="card mb-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Current plan</p>
            <p className="text-2xl font-bold capitalize text-white">{activeWorkspace?.plan ?? 'free'}</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">Active</span>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-400">Next billing date: <span className="text-slate-200">March 21, 2026</span></p>
          <p className="text-sm text-slate-400">Payment method: <span className="text-slate-200">Visa ending in 4242</span></p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-white">Available Plans</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className={`card p-6 ${plan.current ? 'border-brand-500/50 ring-1 ring-brand-500/20' : ''}`}>
            {plan.current && <span className="mb-3 inline-block rounded-full bg-brand-600/20 px-3 py-0.5 text-xs font-medium text-brand-300">Current plan</span>}
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <p className="mt-2 text-3xl font-extrabold text-white">
              {plan.price === null ? 'Custom' : plan.price === 0 ? 'Free' : `$${plan.price}`}
              {plan.price !== null && plan.price > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
            </p>
            <ul className="mt-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <button className="btn-secondary mt-6 w-full">
                {plan.price === null ? 'Contact sales' : 'Upgrade'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
