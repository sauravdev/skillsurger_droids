import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchUserSubscription } from '../lib/subscription';
import { useNavigate } from 'react-router-dom';

interface SubscriptionData {
  id: string;
  user_id: string;
  subscription_id: string;
  subscription_status: string;
  subscription_tier: 'Free' | 'Trial' | 'Monthly Pro' | 'Yearly Pro';
  created_at: string;
  updated_at: string;
  expires_on: string;
  is_active: boolean;
}

interface UserContextType {
  user: any;
  subscription: SubscriptionData | null;
  loading: boolean;
  checkSubscriptionForAI: () => boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  subscription: null,
  loading: true,
  checkSubscriptionForAI: () => false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSubscriptionForAI = (): boolean => {
    // Check if user has a valid subscription for AI features
    if (!subscription) {
      navigate('/pricing');
      return false;
    }

    const tier = subscription.subscription_tier?.toLowerCase();
    if (!tier || tier === 'free') {
      navigate('/pricing');
      return false;
    }

    return true;
  };

  useEffect(() => {
    const getUserAndSubscription = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setSubscription(null);
        setLoading(false);
        return;
      }
      setUser(session.user);

      try {
        const subRes = await fetchUserSubscription(session.user.id);
        if (subRes.success && subRes.data) {
          setSubscription(subRes.data);
        } else {
          setSubscription(null);
        }
      } catch (e) {
        setSubscription(null);
      }
      setLoading(false);
    };

    getUserAndSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getUserAndSubscription();
      } else {
        setUser(null);
        setSubscription(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <UserContext.Provider value={{ user, subscription, loading, checkSubscriptionForAI }}>
      {children}
    </UserContext.Provider>
  );
}; 