import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSettings } from '@/hooks/useSettings';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  interval: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { planId, gateway } = router.query;
  const { data: session, status } = useSession();
  const { settings } = useSettings();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout/' + planId);
    }
  }, [status, planId, router]);

  useEffect(() => {
    if (planId) {
      fetchPlan(planId as string);
    }
  }, [planId]);

  const fetchPlan = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/subscription/plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      } else {
        setError('Plan not found');
      }
    } catch {
      setError('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalCheckout = async () => {
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      const data = await res.json();

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        setError(data.error || 'Failed to create PayPal order');
      }
    } catch {
      setError('Failed to process PayPal checkout');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/checkout/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          gateway,
          cardNumber: formData.get('cardNumber'),
          expMonth: formData.get('expMonth'),
          expYear: formData.get('expYear'),
          cvv: formData.get('cvv'),
          name: formData.get('name')
        })
      });

      const data = await res.json();

      if (data.success) {
        router.push('/checkout/success');
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch {
      setError('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Plan Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The requested plan could not be found.'}
          </p>
          <Link
            href="/admin/pricing"
            className="inline-block px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
          >
            View All Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Subscribe to {settings.businessName} {plan.displayName}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Plan</span>
                  <span className="font-medium text-gray-800 dark:text-white">{plan.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Billing</span>
                  <span className="text-gray-800 dark:text-white">
                    {plan.interval === 'year' ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800 dark:text-white">Total</span>
                <span className="text-green-700">${plan.price.toFixed(2)}/{plan.interval === 'year' ? 'yr' : 'mo'}</span>
              </div>

              {plan.description && (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Payment Method
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              {gateway === 'paypal' ? (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    You will be redirected to PayPal to complete your purchase.
                  </p>
                  <button
                    onClick={handlePayPalCheckout}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-[#0070ba] text-white rounded-lg hover:bg-[#003087] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.825c-.523 0-.967.382-1.05.9l-1.629 10.33a.481.481 0 0 0 .475.555h3.435c.458 0 .847-.334.918-.787l.04-.212.73-4.63.047-.254a.929.929 0 0 1 .918-.788h.578c3.746 0 6.68-1.521 7.537-5.922.357-1.835.176-3.366-.713-4.445a3.586 3.586 0 0 0-.89-.542z"/>
                        </svg>
                        Pay with PayPal
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCardCheckout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      required
                      maxLength={19}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Month
                      </label>
                      <select
                        name="expMonth"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      <select
                        name="expYear"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        required
                        maxLength={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full px-4 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      `Pay $${plan.price.toFixed(2)}`
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure payment powered by {gateway || 'our payment provider'}
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/admin/pricing"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-700"
              >
                Cancel and return to pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
