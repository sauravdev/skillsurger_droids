import React from 'react';
import { useUser } from '../context/UserContext';

function calculateExpiry(subscription: any) {
  if (!subscription) return null;
  const created = new Date(subscription.created_at);
  let expiry: Date | null = null;
  const tier = (subscription.subscription_tier || '');
  expiry = null;

  if (!expiry) {
    if (tier.includes('Annual Pro')) {
      expiry = new Date(created);
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else if (tier.includes('Monthly pro')) {
      expiry = new Date(created);
      expiry.setDate(expiry.getDate() + 30);
    } else if (tier.includes('trial')) {
      expiry = new Date(created);
      expiry.setDate(expiry.getDate() + 7);
    } else {
      expiry = null;
    }
  }
  return expiry;
}

const Subscription: React.FC = () => {
  const { subscription, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading subscription...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">No Subscription Found</h2>
        <p className="text-gray-600">You do not have an active subscription. Please visit the pricing page to purchase a plan.</p>
      </div>
    );
  }

  const expiry = calculateExpiry(subscription);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">Your Subscription</h2>
      <p className="text-gray-500 text-center mb-6">View your current plan and subscription status below.</p>
      <div className="mb-4 flex justify-between">
        <span className="font-medium text-gray-700">Plan:</span>
        <span className="text-blue-600 font-semibold">{subscription.subscription_tier}</span>
      </div>
      <div className="mb-4 flex justify-between">
        <span className="font-medium text-gray-700">Status:</span>
        <span className={subscription.is_active ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {subscription.subscription_status}
        </span>
      </div>
      <div className="mb-4 flex justify-between">
        <span className="font-medium text-gray-700">Started On:</span>
        <span>{new Date(subscription.created_at).toLocaleDateString()}</span>
      </div>
      <div className="mb-4 flex justify-between">
        <span className="font-medium text-gray-700">Expires On:</span>
        <span>{expiry ? expiry.toLocaleDateString() : 'N/A'}</span>
      </div>
      {!subscription.is_active && (
        <div className="mt-6 text-center">
          <span className="text-red-600 font-semibold">Your subscription is not active.</span>
        </div>
      )}
    </div>
  );
};

export default Subscription; 