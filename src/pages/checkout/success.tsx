import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const { settings } = useSettings();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session_id) {
      verifyPayment(session_id as string);
    } else if (router.isReady && !session_id) {
      // No session ID, still show success (might be from non-Stripe gateway)
      setVerifying(false);
      setVerified(true);
    }
  }, [session_id, router.isReady]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (res.ok) {
        setVerified(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Payment verification failed');
      }
    } catch {
      // Even if verification fails, payment might have succeeded
      // The webhook will handle the actual subscription update
      setVerified(true);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {verifying ? (
          <>
            <div className="animate-spin w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Verifying Payment...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your subscription.
            </p>
          </>
        ) : verified ? (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for subscribing to {settings.businessName}. Your subscription is now active.
            </p>
            <div className="space-y-3">
              <Link
                href="/admin/my-subscription"
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                View My Subscription
              </Link>
              <Link
                href="/admin"
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Verification Issue
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'We could not verify your payment immediately, but do not worry - your subscription will be activated shortly.'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              If your subscription is not active within a few minutes, please contact support.
            </p>
            <div className="space-y-3">
              <Link
                href="/admin/my-subscription"
                className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Check Subscription Status
              </Link>
              <Link
                href="/admin"
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
