'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { SubscriptionService } from '@/lib/subscription/service';
import { UserSubscription, UserUsage, SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/subscription/types';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  currentPlan: SubscriptionPlan | null;
  loading: boolean;
  canCreateDocument: boolean;
  documentsUsed: number;
  documentLimit: number | null;
  refreshSubscription: () => Promise<void>;
  checkDocumentLimit: () => Promise<{ canCreate: boolean; reason?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCreateDocument, setCanCreateDocument] = useState(false);
  const [documentsUsed, setDocumentsUsed] = useState(0);
  const [documentLimit, setDocumentLimit] = useState<number | null>(null);

  const refreshSubscription = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [userSubscription, userUsage] = await Promise.all([
        SubscriptionService.getUserSubscription(user.uid),
        SubscriptionService.getUserUsage(user.uid)
      ]);

      setSubscription(userSubscription);
      setUsage(userUsage);

      if (userSubscription) {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === userSubscription.planId);
        setCurrentPlan(plan || SUBSCRIPTION_PLANS[0]);
        
        // Check document creation permission
        const permission = await SubscriptionService.canCreateDocument(user.uid);
        setCanCreateDocument(permission.canCreate);
        setDocumentsUsed(permission.documentsUsed || 0);
        setDocumentLimit(permission.documentLimit || null);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentLimit = async () => {
    if (!user?.uid) {
      return { canCreate: false, reason: 'Not authenticated' };
    }

    const result = await SubscriptionService.canCreateDocument(user.uid);
    setCanCreateDocument(result.canCreate);
    setDocumentsUsed(result.documentsUsed || 0);
    setDocumentLimit(result.documentLimit || null);
    
    return result;
  };

  useEffect(() => {
    if (user?.uid) {
      refreshSubscription();
    } else {
      setSubscription(null);
      setUsage(null);
      setCurrentPlan(null);
      setLoading(false);
      setCanCreateDocument(false);
      setDocumentsUsed(0);
      setDocumentLimit(null);
    }
  }, [user?.uid]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        usage,
        currentPlan,
        loading,
        canCreateDocument,
        documentsUsed,
        documentLimit,
        refreshSubscription,
        checkDocumentLimit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
