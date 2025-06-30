import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, Briefcase, Award } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';

interface OnboardingData {
  fullName: string;
  currentRole: string;
  yearsOfExperience: string;
  workPreference: string;
  preferredLocations: string;
}

const workPreferences = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote_only', label: 'Remote' },
  { value: 'office_only', label: 'Office' }
];

export default function OnboardingForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    currentRole: '',
    yearsOfExperience: '',
    workPreference: 'hybrid',
    preferredLocations: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          current_role: formData.currentRole,
          years_of_experience: parseInt(formData.yearsOfExperience, 10) || 0,
          remote_preference: formData.workPreference,
          preferred_locations: formData.preferredLocations.split(',').map(loc => loc.trim()).filter(Boolean),
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      navigate('/dashboard?section=profile');
      window.location.reload();

    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.fullName.trim() && formData.currentRole.trim() && formData.yearsOfExperience.trim() && formData.preferredLocations.trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Skillsurger!</h1>
          <p className="text-gray-600">Just a few more details to personalize your experience.</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Final Touches</h2>
              <p className="text-gray-600 mt-2">The rest of your profile will be populated from your CV.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Role *</label>
                <div className="relative">
                  <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                <div className="relative">
                  <Award className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Preference</label>
                <select
                  value={formData.workPreference}
                  onChange={(e) => setFormData({ ...formData, workPreference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {workPreferences.map(pref => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Working Locations *</label>
                <input
                  type="text"
                  value={formData.preferredLocations}
                  onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., New York, Remote, San Francisco"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple locations with commas</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Saving...' : 'Save and Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}