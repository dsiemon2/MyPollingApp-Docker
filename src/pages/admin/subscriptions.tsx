import AdminLayout from '@/components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { PLAN_CONFIGS, PlanType } from '@/config/plans';

interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: string;
  currentPeriodEnd?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    createdAt: string;
    _count: { polls: number };
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<PlanType>('FREE');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (userId: string, plan: PlanType) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan })
      });
      if (res.ok) {
        setEditingId(null);
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const getPlanBadgeColor = (plan: PlanType) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-700';
      case 'STARTER': return 'bg-blue-100 text-blue-700';
      case 'PROFESSIONAL': return 'bg-purple-100 text-purple-700';
      case 'ENTERPRISE': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'TRIALING': return 'bg-blue-100 text-blue-700';
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout active="subscriptions">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Subscriptions</h1>
        <p className="text-gray-600 mt-1">Manage user subscription plans and features</p>
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => {
          const config = PLAN_CONFIGS[plan];
          const count = subscriptions.filter(s => s.plan === plan).length;
          return (
            <div key={plan} className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">{config.displayName}</div>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-400">{config.priceLabel}</div>
            </div>
          );
        })}
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No subscriptions found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Polls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Features</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => {
                const planConfig = PLAN_CONFIGS[sub.plan];
                return (
                  <tr key={sub.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{sub.user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{sub.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === sub.id ? (
                        <select
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value as PlanType)}
                          className="px-2 py-1 border rounded"
                        >
                          {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((p) => (
                            <option key={p} value={p}>{PLAN_CONFIGS[p].displayName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(sub.plan)}`}>
                          {planConfig.displayName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-800">{sub.user._count.polls}</span>
                      <span className="text-gray-400 text-sm">
                        /{planConfig.features.maxActivePolls === -1 ? '∞' : planConfig.features.maxActivePolls}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {planConfig.features.voiceChat && (
                          <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Voice</span>
                        )}
                        {planConfig.features.basicAiInsights && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">AI</span>
                        )}
                        {planConfig.features.customBranding && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">Brand</span>
                        )}
                        {planConfig.features.apiAccess && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">API</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === sub.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSubscription(sub.userId, editPlan)}
                            className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-sm bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(sub.id);
                            setEditPlan(sub.plan);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-800"
                        >
                          Change Plan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Plan Features Reference */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Plan Features Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Feature</th>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <th key={plan} className="text-center py-2">{PLAN_CONFIGS[plan].displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Active Polls</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.maxActivePolls === -1 ? 'Unlimited' : PLAN_CONFIGS[plan].features.maxActivePolls}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Votes per Poll</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.maxVotesPerPoll === -1 ? 'Unlimited' : PLAN_CONFIGS[plan].features.maxVotesPerPoll}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Voice Chat</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.voiceChat ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">AI Insights</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.advancedAiInsights ? 'Advanced' :
                     PLAN_CONFIGS[plan].features.basicAiInsights ? 'Basic' : '✗'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Custom Branding</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.customBranding ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">Analytics</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.analyticsDashboard ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2">API Access</td>
                {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => (
                  <td key={plan} className="text-center py-2">
                    {PLAN_CONFIGS[plan].features.apiAccess ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
