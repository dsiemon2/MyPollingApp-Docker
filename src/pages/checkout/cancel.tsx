import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const { plan_id } = router.query;
  const { settings } = useSettings();

  const handleRetry = () => {
    if (plan_id) {
      router.push(`/admin/pricing`);
    } else {
      router.push('/admin/pricing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Checkout Cancelled
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your payment was cancelled. No charges were made to your account.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Changed your mind? You can always come back and subscribe later. Your current plan will remain active.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>

          <Link
            href="/admin/pricing"
            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            View All Plans
          </Link>

          <Link
            href="/admin"
            className="block w-full px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          >
            Return to Dashboard
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href={`mailto:support@${settings.businessName?.toLowerCase().replace(/\s+/g, '')}.com`} className="text-purple-600 hover:underline">
              support@{settings.businessName?.toLowerCase().replace(/\s+/g, '') || 'mypollingapp'}.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
