'use client';

import React from 'react';
import { useSubscription } from './SubscriptionProvider';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

export default function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  const { currentPlan, documentsUsed, documentLimit } = useSubscription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">
                Upgrade to unlock unlimited document creation and premium features
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Usage indicator for free users */}
          {currentPlan?.id === 'free' && documentLimit && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-800">
                  Document Usage
                </span>
                <span className="text-sm text-amber-600">
                  {documentsUsed} / {documentLimit} documents used
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((documentsUsed / documentLimit) * 100, 100)}%` }}
                ></div>
              </div>
              {documentsUsed >= documentLimit && (
                <p className="text-sm text-amber-700 mt-2">
                  ⚠️ You've reached your document limit. Upgrade to Pro for unlimited documents.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-6 relative ${
                  plan.id === currentPlan?.id
                    ? 'border-blue-500 bg-blue-50'
                    : plan.id === 'pro_monthly'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.id === 'pro_monthly' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  </div>
                )}
                
                {plan.id === currentPlan?.id && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">
                      /{plan.interval}
                    </span>
                  </div>
                  {plan.id === 'pro_monthly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Save $20/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={plan.id === currentPlan?.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.id === currentPlan?.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.id === 'free'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : plan.id === 'pro_monthly'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {plan.id === currentPlan?.id
                    ? 'Current Plan'
                    : plan.id === 'free'
                    ? 'Downgrade to Free'
                    : 'Upgrade to Pro'
                  }
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              All plans include a 30-day money-back guarantee. 
              <br />
              Cancel anytime, no questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
