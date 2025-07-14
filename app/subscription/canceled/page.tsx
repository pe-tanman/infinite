'use client';

import Link from 'next/link';

export default function SubscriptionCanceledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Canceled
        </h1>
        
        <p className="text-gray-600 mb-6">
          You canceled the subscription process. Don't worry, you can still use your free account with up to 15 documents.
        </p>

        <div className="space-y-3">
          <Link 
            href="/new"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Continue with Free Account
          </Link>
          
          <Link 
            href="/subscription/pricing"
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors inline-block"
          >
            View Pricing Again
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@infinite.com" className="text-blue-600 hover:text-blue-700">
              support@infinite.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
