import { SubscriptionData } from '../context/UserContext';

/**
 * Calculate the expiry date for a subscription based on its tier and creation date
 */
export function calculateSubscriptionExpiry(subscription: SubscriptionData): Date | null {
  if (!subscription) return null;
  
  const created = new Date(subscription.created_at);
  const tier = (subscription.subscription_tier || '').toLowerCase();
  
  if (tier.includes('annual pro') || tier.includes('yearly pro')) {
    const expiry = new Date(created);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  } else if (tier.includes('monthly pro')) {
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  } else if (tier.includes('trial')) {
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }
  
  return null;
}

/**
 * Check if a subscription is currently valid and not expired
 */
export function isSubscriptionValid(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  // Check if subscription is active
  if (subscription.subscription_status !== 'active') return false;
  
  // Check if subscription has expires_on field and it's expired
  if (subscription.expires_on) {
    const expiryDate = new Date(subscription.expires_on);
    if (new Date() > expiryDate) return false;
  }
  
  // Check trial expiration using calculated expiry
  const calculatedExpiry = calculateSubscriptionExpiry(subscription);
  if (calculatedExpiry && new Date() > calculatedExpiry) return false;
  
  return true;
}

/**
 * Check if user has access to AI features
 */
export function hasAIFeatureAccess(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  const tier = subscription.subscription_tier?.toLowerCase();
  if (!tier || tier === 'free') return false;
  
  return isSubscriptionValid(subscription);
}

/**
 * Get subscription status message for display
 */
export function getSubscriptionStatusMessage(subscription: SubscriptionData | null): string {
  if (!subscription) return 'No subscription found';
  
  if (!isSubscriptionValid(subscription)) {
    const tier = subscription.subscription_tier?.toLowerCase();
    if (tier === 'trial') {
      return 'Your trial has expired';
    }
    return 'Your subscription is not active';
  }
  
  return 'Active subscription';
}

/**
 * Get days remaining for trial subscription
 */
export function getTrialDaysRemaining(subscription: SubscriptionData | null): number {
  if (!subscription) return 0;
  
  const tier = subscription.subscription_tier?.toLowerCase();
  if (!tier.includes('trial')) return 0;
  
  const expiry = calculateSubscriptionExpiry(subscription);
  if (!expiry) return 0;
  
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
