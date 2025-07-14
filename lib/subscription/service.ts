import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { UserSubscription, UserUsage, SUBSCRIPTION_PLANS } from './types';

export class SubscriptionService {
  // Get user's current subscription
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          currentPeriodStart: data.currentPeriodStart.toDate(),
          currentPeriodEnd: data.currentPeriodEnd.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserSubscription;
      }
      
      // Return default free subscription if none exists
      return this.createFreeSubscription(userId);
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Create free subscription for new users
  static async createFreeSubscription(userId: string): Promise<UserSubscription> {
    const now = new Date();
    const subscription: UserSubscription = {
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()), // 1 year
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'subscriptions', userId), {
        ...subscription,
        currentPeriodStart: serverTimestamp(),
        currentPeriodEnd: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating free subscription:', error);
    }

    return subscription;
  }

  // Get user's usage statistics
  static async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      const docRef = doc(db, 'usage', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastResetDate: data.lastResetDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserUsage;
      }
      
      // Create new usage record
      return this.createUserUsage(userId);
    } catch (error) {
      console.error('Error getting user usage:', error);
      // Return default usage
      return {
        userId,
        documentsCreated: 0,
        documentsThisMonth: 0,
        lastResetDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // Create new usage record
  static async createUserUsage(userId: string): Promise<UserUsage> {
    const now = new Date();
    const usage: UserUsage = {
      userId,
      documentsCreated: 0,
      documentsThisMonth: 0,
      lastResetDate: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'usage', userId), {
        ...usage,
        lastResetDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user usage:', error);
    }

    return usage;
  }

  // Check if user can create a new document
  static async canCreateDocument(userId: string): Promise<{ canCreate: boolean; reason?: string; documentsUsed?: number; documentLimit?: number }> {
    try {
      const [subscription, usage] = await Promise.all([
        this.getUserSubscription(userId),
        this.getUserUsage(userId)
      ]);

      if (!subscription) {
        return { canCreate: false, reason: 'No subscription found' };
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId);
      if (!plan) {
        return { canCreate: false, reason: 'Invalid subscription plan' };
      }

      // Unlimited for pro plans
      if (plan.documentLimit === null) {
        return { canCreate: true };
      }

      // Check if user has reached their limit
      if (usage.documentsCreated >= plan.documentLimit) {
        return { 
          canCreate: false, 
          reason: `You've reached your limit of ${plan.documentLimit} documents. Upgrade to Pro for unlimited documents.`,
          documentsUsed: usage.documentsCreated,
          documentLimit: plan.documentLimit
        };
      }

      return { 
        canCreate: true,
        documentsUsed: usage.documentsCreated,
        documentLimit: plan.documentLimit
      };
    } catch (error) {
      console.error('Error checking document creation permission:', error);
      return { canCreate: false, reason: 'Error checking permissions' };
    }
  }

  // Increment document count when user creates a document
  static async incrementDocumentCount(userId: string): Promise<void> {
    try {
      const usage = await this.getUserUsage(userId);
      
      await updateDoc(doc(db, 'usage', userId), {
        documentsCreated: usage.documentsCreated + 1,
        documentsThisMonth: usage.documentsThisMonth + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error incrementing document count:', error);
    }
  }

  // Get user's current plan
  static async getUserPlan(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return SUBSCRIPTION_PLANS[0]; // Default to free
    
    return SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId) || SUBSCRIPTION_PLANS[0];
  }

  // Update subscription (for when payment is successful)
  static async updateSubscription(userId: string, updates: Partial<UserSubscription>): Promise<void> {
    try {
      await updateDoc(doc(db, 'subscriptions', userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }
}
