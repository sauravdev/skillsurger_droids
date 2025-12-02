import React from 'react';
import { useUser } from '../context/UserContext';
import { CheckCircle, XCircle, Zap, Star } from 'lucide-react';
import { calculateSubscriptionExpiry, isSubscriptionValid, getTrialDaysRemaining } from '../lib/subscriptionUtils';
import SEO from '../components/SEO';

function calculateExpiry(subscription: any) {
  if (!subscription) return null;
  const tier = (subscription.subscription_tier || '').toLowerCase();
  
  // For trials, always calculate from created_at
  if (tier.includes('trial')) {
    const created = new Date(subscription.created_at);
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }
  
  // For paid plans, use updated_at if available (for renewals), otherwise created_at
  const baseDate = subscription.updated_at 
    ? new Date(subscription.updated_at) 
    : new Date(subscription.created_at);
  
  if (tier.includes('annual pro') || tier.includes('yearly pro')) {
    const expiry = new Date(baseDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  } else if (tier.includes('monthly pro')) {
    const expiry = new Date(baseDate);
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry;
  }
  
  return null;
}

const PLAN_COLORS: Record<string, string> = {
  trial: 'bg-yellow-100 text-yellow-800',
  pro: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800',
  default: 'bg-gray-100 text-gray-800',
};

const Subscription: React.FC = () => {
  const { subscription, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg font-medium text-blue-700">Loading subscription...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <XCircle className="w-14 h-14 text-red-400 mb-4" />
        <h2 className="text-3xl font-bold mb-2">No Subscription Found</h2>
        <p className="text-gray-600 mb-6 text-lg">You do not have an active subscription. Please visit the pricing page to purchase a plan.</p>
        <a
          href="/pricing"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition text-lg"
        >
          View Plans
        </a>
      </div>
    );
  }

  const expiry = calculateSubscriptionExpiry(subscription);
  const tier = (subscription.subscription_tier || '').toLowerCase();
  const planColor = PLAN_COLORS[tier.includes('trial') ? 'trial' : tier.includes('pro') ? 'pro' : tier.includes('premium') ? 'premium' : 'default'];
  const isActive = isSubscriptionValid(subscription);
  const trialDaysRemaining = getTrialDaysRemaining(subscription);

  return (
    <div className="flex flex-col items-center min-h-[70vh] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-2">
      <SEO 
        title="Subscription | Manage Your Plan | Skillsurger"
        description="Manage your Skillsurger subscription. View plan details, upgrade options, and subscription status."
        keywords="subscription management, plan details, upgrade subscription"
        canonicalUrl="/subscription"
        noIndex={true}
      />
      <div className="w-full max-w-3xl md:w-[70vw] bg-white/90 rounded-2xl shadow-xl border border-blue-100 p-10 relative flex flex-col items-center">
        {/* Icon/Illustration */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full p-4 shadow-lg">
          <Zap className="w-10 h-10 text-white" />
        </div>
        {/* Plan Badge */}
        <span className={`px-4 py-1 rounded-full text-sm font-semibold mb-4 mt-6 ${planColor} shadow-sm uppercase tracking-wide`}>{subscription.subscription_tier}</span>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-center text-blue-900">Your Subscription</h2>
        <p className="text-gray-500 text-center mb-8 text-lg">View your current plan and subscription status below.</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-2 bg-blue-50/60 rounded-lg p-5 border border-blue-100">
            <span className="font-medium text-gray-700 flex items-center">Plan <Star className="w-4 h-4 ml-2 text-yellow-500" /></span>
            <span className="text-blue-700 font-bold text-lg capitalize">{subscription.subscription_tier}</span>
          </div>
          <div className="flex flex-col gap-2 bg-blue-50/60 rounded-lg p-5 border border-blue-100">
            <span className="font-medium text-gray-700 flex items-center">Status {isActive ? <CheckCircle className="w-4 h-4 ml-2 text-green-500" /> : <XCircle className="w-4 h-4 ml-2 text-red-500" />}</span>
            <span className={isActive ? 'text-green-600 font-bold text-lg' : 'text-red-600 font-bold text-lg'}>
              {subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <span className="font-medium text-gray-700">Started On</span>
            <span className="text-gray-800 font-semibold">{new Date(subscription.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <span className="font-medium text-gray-700">Expires On</span>
            <span className="text-gray-800 font-semibold">{expiry ? expiry.toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        {subscription.subscription_status !== "active" && (
          <div className="mt-2 text-center">
            <span className="text-red-600 font-semibold text-lg">Your subscription is not active.</span>
          </div>
        )}
        {tier.includes('trial') && (
          <div className="mt-4 text-center">
            {trialDaysRemaining > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">
                  ⏰ {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Upgrade to continue using all features after your trial expires
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">
                  ⚠️ Your trial has expired
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Please upgrade to continue using all features
                </p>
              </div>
            )}
          </div>
        )}
        {tier.includes('trial') && trialDaysRemaining > 0 && (
          <div className="mt-2 text-center">
            <span className="text-yellow-600 font-semibold text-lg">Your 7-day Trial is live</span>
          </div>
        )}
        {/* Upgrade Plan Button */}
        <div className="mt-10 flex justify-center w-full">
          <a
            href="/pricing"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg text-lg transition transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    </div>
  );
};

export default Subscription; 