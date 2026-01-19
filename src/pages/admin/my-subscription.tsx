import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface Subscription {
  id: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  plan: {
    id: string;
    name: string;
    price: number;
    billingPeriod: string;
    pollsPerMonth: number | null;
    features: string | null;
  };
}

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/admin/my-subscription');
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSubscription();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      alert('Error canceling subscription');
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('/api/admin/subscription/resume', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSubscription();
      } else {
        alert(data.error || 'Failed to resume subscription');
      }
    } catch (err) {
      alert('Error resuming subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-yellow-100 text-yellow-800',
      past_due: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout active="my-subscription">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="my-subscription">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold dark:text-white">My Subscription</h1>

        {subscription ? (
          <>
            {/* Current Subscription */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-lg font-semibold">Current Plan: {subscription.plan.name}</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Billing Period</p>
                    <p className="font-semibold dark:text-white">
                      {subscription.plan.billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="font-semibold dark:text-white">
                      ${subscription.plan.price.toFixed(2)}/{subscription.plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                    </p>
                  </div>
                </div>

                <hr className="dark:border-gray-700 mb-6" />

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Period Started</p>
                    <p className="font-semibold dark:text-white">
                      {subscription.currentPeriodStart
                        ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Period Ends</p>
                    <p className="font-semibold dark:text-white">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  {subscription.trialEndsAt && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Trial Ends</p>
                      <p className="font-semibold dark:text-white">
                        {new Date(subscription.trialEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <hr className="dark:border-gray-700 mb-6" />

                <div className="flex gap-4">
                  <Link
                    href="/admin/pricing"
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                  >
                    Change Plan
                  </Link>
                  {subscription.status === 'active' && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  {subscription.status === 'canceled' && (
                    <button
                      onClick={handleResume}
                      className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700"
                    >
                      Resume Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Plan Features</h2>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 dark:text-white">
                  <span className="text-green-500">✓</span>
                  Polls per month: {subscription.plan.pollsPerMonth || 'Unlimited'}
                </li>
                {subscription.plan.features &&
                  JSON.parse(subscription.plan.features).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 dark:text-white">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
              </ul>
            </div>
          </>
        ) : (
          /* No Subscription */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-xl font-semibold mb-2 dark:text-white">No Active Subscription</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Choose a plan to unlock all features and get started.
            </p>
            <Link
              href="/admin/pricing"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Pricing Plans
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
