'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSubscription } from '@/components/subscription/SubscriptionProvider';
import PricingModal from '@/components/subscription/PricingModal';
import Link from 'next/link';

export default function PricingPage() {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      setShowPricingModal(false);
      return;
    }

    try {
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free plan and upgrade when you're ready for unlimited document creation and premium features.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowPricingModal(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            View All Plans
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Current Plan: <strong>{currentPlan?.name || 'Free'}</strong>
          </p>
          <Link 
            href="/new"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
