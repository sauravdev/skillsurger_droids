import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Upload, Linkedin } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { generateCareerSuggestions, generateLearningPlan } from '../lib/openai';
import { uploadCV, parseCV } from '../lib/pdf';

type WizardStep = 'credentials' | 'profile' | 'interests' | 'career' | 'complete';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  cv: FileList;
  linkedinUrl: string;
  interests: string[];
  skills: string[];
}

export default function SignUpWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('credentials');
  const [careerSuggestions, setCareerSuggestions] = useState<string>('');
  const [learningPlan, setLearningPlan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpData>();

  const onSubmit = async (data: SignUpData) => {
    try {
      setError('');
      setUploading(true);

      // Create user account
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please log in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!signUpData.user) {
        setError('Failed to create account. Please try again.');
        return;
      }

      let cvUrl = '';
      let parsedCvData = null;

      // Parse and upload CV if provided
      if (data.cv?.[0]) {
        // First parse the CV
        parsedCvData = await parseCV(data.cv[0]);
        // Then upload it
        cvUrl = await uploadCV(data.cv[0], signUpData.user.id);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            full_name: data.fullName,
            linkedin_url: data.linkedinUrl,
            cv_url: cvUrl,
            years_of_experience: parsedCvData?.years_of_experience || 0,
            summary: parsedCvData?.summary || '',
            experience: parsedCvData?.experience || [],
            projects: parsedCvData?.projects || [],
            skills: parsedCvData?.skills || [],
            education: parsedCvData?.education || [],
            cv_parsed_data: parsedCvData || {}
          }
        ])
        .select();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        setError('Error creating profile. Please try again.');
        return;
      }

      // Add skills
      if (data.skills?.length) {
        const skillsArray = typeof data.skills === 'string' 
          ? data.skills.split(',').map(s => s.trim())
          : data.skills;

        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(
            skillsArray.map(skill => ({
              user_id: signUpData.user.id,
              skill: skill
            }))
          );

        if (skillsError) {
          console.error('Error adding skills:', skillsError);
        }
      }

      // Add interests
      if (data.interests?.length) {
        const interestsArray = typeof data.interests === 'string'
          ? data.interests.split(',').map(i => i.trim())
          : data.interests;

        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(
            interestsArray.map(interest => ({
              user_id: signUpData.user.id,
              interest: interest
            }))
          );

        if (interestsError) {
          console.error('Error adding interests:', interestsError);
        }
      }

      // Generate career suggestions
      const suggestions = await generateCareerSuggestions(
        typeof data.skills === 'string' ? data.skills.split(',') : data.skills,
        typeof data.interests === 'string' ? data.interests.split(',') : data.interests
      );

      await supabase
        .from('career_suggestions')
        .insert([{
          user_id: signUpData.user.id,
          suggestion: suggestions
        }]);

      setCareerSuggestions(suggestions);

      // Generate learning plan
      const plan = await generateLearningPlan(
        typeof data.skills === 'string' ? data.skills.split(',')[0] : data.skills[0]
      );

      await supabase
        .from('learning_plans')
        .insert([{
          user_id: signUpData.user.id,
          plan_content: plan
        }]);

      setLearningPlan(plan);
      setCurrentStep('complete');

    } catch (error) {
      console.error('Error during sign up:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {currentStep === 'credentials' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
            <form onSubmit={handleSubmit(() => setCurrentStep('profile'))}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    {...register('password', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Next
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Professional Profile</h2>
            <form onSubmit={handleSubmit(() => setCurrentStep('interests'))}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    {...register('fullName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload CV (PDF)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            {...register('cv')}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn Profile</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Linkedin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...register('linkedinUrl')}
                      className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Next'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'interests' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Skills & Interests</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                  <input
                    type="text"
                    {...register('skills')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="JavaScript, Python, Project Management..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interests (comma-separated)</label>
                  <input
                    type="text"
                    {...register('interests')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="AI, Web Development, Data Science..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? 'Processing...' : 'Complete Sign Up'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 'complete' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Welcome to Skillsurger!</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Suggested Career Paths</h3>
                <div className="prose max-w-none">
                  {careerSuggestions}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Your Learning Plan</h3>
                <div className="prose max-w-none">
                  {learningPlan}
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}