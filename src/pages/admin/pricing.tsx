import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Plan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  billingPeriod: string;
  pollsPerMonth: number | null;
  features: string | null;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
        setCurrentPlanId(data.currentPlanId);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await fetch(`/api/admin/subscription/subscribe/${planId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.message || 'Failed to start subscription');
      }
    } catch (err) {
      alert('Error starting subscription process');
    }
  };

  const handleStartTrial = async (planId: string) => {
    try {
      const res = await fetch(`/api/admin/subscription/start-trial/${planId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Free trial started! Enjoy your subscription.');
        window.location.href = '/admin/my-subscription';
      } else {
        alert(data.message || 'Failed to start free trial');
      }
    } catch (err) {
      alert('Error starting free trial');
    }
  };

  if (loading) {
    return (
      <AdminLayout active="pricing">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="pricing">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold dark:text-white">Pricing Plans</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Choose the perfect plan for your polling needs
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {plans.length > 0 ? (
            plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const isRecommended = plan.code === 'standard' || plan.code === 'professional';
              const features = plan.features ? JSON.parse(plan.features) : [];

              return (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col ${
                    isCurrent ? 'ring-2 ring-green-500' : isRecommended ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {isCurrent && (
                    <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
                      Current Plan
                    </div>
                  )}
                  {!isCurrent && isRecommended && (
                    <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                      Recommended
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {plan.description || ''}
                    </p>

                    <div className="my-6">
                      <span className="text-4xl font-bold dark:text-white">
                        ${plan.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /{plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>

                    <ul className="space-y-3 flex-1">
                      <li className="flex items-center gap-2 text-sm dark:text-white">
                        <span className="text-green-500">✓</span>
                        <strong>{plan.pollsPerMonth || 'Unlimited'}</strong> polls/month
                      </li>
                      {features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm dark:text-white">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      ) : plan.price === 0 ? (
                        <button
                          onClick={() => handleStartTrial(plan.id)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                        >
                          Start Free Trial
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Subscribe
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">ℹ️</div>
              <h2 className="text-xl font-semibold mb-2 dark:text-white">No Plans Available</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Please check back later or contact support.
              </p>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-4 text-center dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium dark:text-white">Can I change my plan later?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Yes! You can upgrade or downgrade your plan at any time. Changes will take effect at
                the start of your next billing cycle.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium dark:text-white">Is there a free trial?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium dark:text-white">How do I cancel my subscription?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                You can cancel anytime from your subscription management page. You'll retain access
                until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
