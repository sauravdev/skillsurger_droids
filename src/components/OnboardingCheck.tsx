import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import OnboardingForm from './OnboardingForm';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export default function OnboardingCheck({ children }: OnboardingCheckProps) {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, current_role')
        .eq('id', user.id)
        .single();

      // Check if essential onboarding fields are missing
      const isOnboardingComplete = profile?.full_name && 
                                  profile?.phone && 
                                  profile?.current_role;

      setNeedsOnboarding(!isOnboardingComplete);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setNeedsOnboarding(true); // Default to showing onboarding on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingForm />;
  }

  return <>{children}</>;
}