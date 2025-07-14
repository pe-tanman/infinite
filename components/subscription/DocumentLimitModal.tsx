'use client';

import React from 'react';
import { useSubscription } from './SubscriptionProvider';

interface DocumentLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function DocumentLimitModal({ isOpen, onClose, onUpgrade }: DocumentLimitModalProps) {
  const { documentsUsed, documentLimit, currentPlan } = useSubscription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Document Limit Reached
          </h3>
          
          <p className="text-gray-600 mb-4">
            You've created {documentsUsed} out of {documentLimit} documents allowed on the {currentPlan?.name} plan.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usage</span>
              <span className="text-sm text-gray-600">
                {documentsUsed} / {documentLimit} documents
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              🚀 Upgrade to Pro - Unlimited Documents
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Pro plans start at $9.99/month with unlimited documents and premium features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
