import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Search, FileText, Brain, Download, ExternalLink, Bookmark,
  BookmarkCheck, Trash2, AlertTriangle, Plus, X, Sparkles, Target, MapPin, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import CVEditor from './CVEditor';
import CVSuggestionManager from './CVSuggestionManager';
import {
  type CareerOption,
  type JobOpportunity,
  type CVSuggestion,
  generateCareerOptions,
  findJobOpportunities,
  generateCVSuggestions
} from '../lib/careerServices';
import { cleanTruncatedDescription } from '../lib/utils';
import { useUser } from '../context/UserContext';

interface AcceptedSuggestions {
  summary?: string;
  skills?: string[];
  experienceImprovements?: Array<{ original: string; improved: string }>;
  [key: string]: any;
}

interface ExperienceItem {
  id?: string;
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description: string;
}

interface CareerExplorerProps {
  onGenerateLearningPath: (job: JobOpportunity) => void;
  jobs: JobOpportunity[];
  setJobs: (jobs: JobOpportunity[]) => void;
  selectedCareer: string;
  setSelectedCareer: (career: string) => void;
}

export default function CareerExplorer({ onGenerateLearningPath, jobs, setJobs, selectedCareer, setSelectedCareer }: CareerExplorerProps) {
  const navigate = useNavigate();
  const { checkSubscriptionForAI } = useUser();
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [cvSuggestions, setCvSuggestions] = useState<CVSuggestion | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingJob, setSavingJob] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showCVEditor, setShowCVEditor] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
  // Add a single button to apply all suggestions

  // New state for custom form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [referenceJobDescription, setReferenceJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  // Track which generation method was used for job finding
  const [lastGenerationMethod, setLastGenerationMethod] = useState<'profile' | 'interests'>('profile');
  const [lastCustomFormData, setLastCustomFormData] = useState<any>(null);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  useEffect(() => {
    loadUserData();
    loadSavedCareers();
    // Don't load saved jobs by default - we'll show actual job postings instead
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load comprehensive profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        console.log('Loaded complete profile data:', profileData);
      }

      // Load skills
      const { data: skills } = await supabase
        .from('user_skills')
        .select('skill')
        .eq('user_id', user.id);

      if (skills) {
        setUserSkills(skills.map(s => s.skill));
      }

      // Load interests
      const { data: interests } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_id', user.id);

      if (interests) {
        setUserInterests(interests.map(i => i.interest));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async function loadSavedCareers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load only the latest careers (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: careers, error: careersError } = await supabase
        .from('generated_careers')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5); // Only show latest 5 careers

      if (careersError) throw careersError;

      if (careers) {
        setCareerOptions(careers.map(career => ({
          id: career.id,
          title: career.title,
          description: career.description,
          requiredSkills: career.required_skills,
          potentialCompanies: career.potential_companies,
          averageSalary: career.average_salary,
          growthPotential: career.growth_potential
        })));
      }
    } catch (error) {
      console.error('Error loading saved careers:', error);
    }
  }

  async function loadSavedJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load only the latest jobs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: savedJobs, error: jobsError } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (savedJobs) {
        // Create a set of saved job identifiers for quick lookup
        const savedJobIdentifiers = new Set(
          savedJobs.map(job => `${job.title}-${job.company}`)
        );
        setSavedJobIds(savedJobIdentifiers);

        setJobs(savedJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          type: job.type,
          salary: job.salary
        })));
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  }

  async function saveCareerOptions(options: CareerOption[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete old careers (older than 30 days) to keep only latest
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString());

      const careersToSave = options.map(option => ({
        user_id: user.id,
        title: option.title,
        description: option.description,
        required_skills: option.requiredSkills,
        potential_companies: option.potentialCompanies,
        average_salary: option.averageSalary,
        growth_potential: option.growthPotential
      }));

      const { error } = await supabase
        .from('generated_careers')
        .insert(careersToSave);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving career options:', error);
      throw error;
    }
  }

  async function saveJob(job: JobOpportunity) {
    try {
      setSavingJob(`${job.title}-${job.company}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const jobToSave = {
        user_id: user.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        type: job.type,
        salary: job.salary
      };

      const { error } = await supabase
        .from('saved_jobs')
        .insert([jobToSave]);

      if (error) throw error;

      // Update local state
      setSavedJobIds(prev => new Set([...prev, `${job.title}-${job.company}`]));
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Job "${job.title}" saved successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error saving job:', error);
      setError('Failed to save job');
    } finally {
      setSavingJob(null);
    }
  }

  const handleDeleteCareer = async (careerIndex: number) => {
    const deleteKey = `career-${careerIndex}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const career = careerOptions[careerIndex];
      
      // Delete from database
      const { error } = await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id)
        .eq('title', career.title);

      if (error) throw error;

      // Update local state
      setCareerOptions(prev => prev.filter((_, index) => index !== careerIndex));
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Career "${career.title}" deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting career:', error);
      setError('Failed to delete career option');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteJob = async (jobIndex: number) => {
    const deleteKey = `job-${jobIndex}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const job = jobs[jobIndex];
      
      // Delete from database
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('title', job.title)
        .eq('company', job.company);

      if (error) throw error;

      // Update local state
      const newJobs = jobs.filter((_, index) => index !== jobIndex);
      setJobs(newJobs);
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${job.title}-${job.company}`);
        return newSet;
      });
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Job "${job.title}" deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllCareers = async () => {
    const deleteKey = 'all-careers';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all careers from database
      const { error } = await supabase
        .from('generated_careers')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCareerOptions([]);
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All career options deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting all careers:', error);
      setError('Failed to delete all career options');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAllJobs = async () => {
    const deleteKey = 'all-jobs';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all jobs from database
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setJobs([]);
      setSavedJobIds(new Set());
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'All saved jobs deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('Error deleting all jobs:', error);
      setError('Failed to delete all saved jobs');
    } finally {
      setDeleting(null);
    }
  };

  const renderDeleteButton = (deleteKey: string, onDelete: () => void, label: string) => {
    const isConfirming = showDeleteConfirm === deleteKey;
    const isDeleting = deleting === deleteKey;

    if (!isConfirming) {
      return (
        <Button
          onClick={onDelete}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Delete {label}?</span>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(null)}
          disabled={isDeleting}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    );
  };

  const isJobSaved = (job: JobOpportunity) => {
    return savedJobIds.has(`${job.title}-${job.company}`);
  };

  const generateJobApplicationUrl = (job: JobOpportunity) => {
    // If the job has an applicationUrl (from Adzuna API), use it directly
    if (job.applicationUrl) {
      return job.applicationUrl;
    }
    
    // Fallback to generating URLs for jobs without direct application links
    const companyName = job.company.toLowerCase().replace(/\s+/g, '');
    const jobTitle = job.title.toLowerCase().replace(/\s+/g, '-');
    
    // Common job board URLs based on company patterns
    const jobBoards = [
      `https://careers.${companyName}.com/jobs/${jobTitle}`,
      `https://jobs.lever.co/${companyName}/${jobTitle}`,
      `https://boards.greenhouse.io/${companyName}/jobs/${jobTitle}`,
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}`,
      `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}`,
      `https://www.glassdoor.com/Jobs/${job.company.replace(/\s+/g, '-')}-jobs-SRCH_KE0,${job.company.length}.htm`
    ];

    // Return a random job board URL for demonstration
    return jobBoards[Math.floor(Math.random() * jobBoards.length)];
  };

  const handleGenerateCareerOptions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }
      
      // Clear old career options to show only latest
      setCareerOptions([]);
      
      // Prepare comprehensive profile data for career generation
      const comprehensiveProfileData = {
        skills: userSkills,
        interests: userInterests,
        yearsOfExperience: profile?.years_of_experience || 0,
        currentRole: profile?.current_role || '',
        desiredRole: profile?.desired_role || '',
        location: {
          city: profile?.city || '',
          state: profile?.state || '',
          country: profile?.country || ''
        },
        workPreferences: {
          workType: profile?.preferred_work_type || '',
          remotePreference: profile?.remote_preference || '',
          willingToRelocate: profile?.willing_to_relocate || false,
          preferredLocations: profile?.preferred_locations || []
        },
        salaryExpectations: {
          min: profile?.min_salary_expectation || null,
          max: profile?.max_salary_expectation || null
        },
        education: profile?.education || [],
        experience: profile?.experience || [],
        languages: profile?.languages || [],
        summary: profile?.summary || ''
      };

      console.log('Generating latest careers with comprehensive data:', comprehensiveProfileData);

      const options = await generateCareerOptions(
        userSkills,
        userInterests,
        profile?.years_of_experience || 0,
        comprehensiveProfileData
      );
      
      await saveCareerOptions(options);
      setCareerOptions(options);
      setLastGenerationMethod('profile');
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Generated ${options.length} latest career options!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error generating career options:', error);
      setError('Failed to generate career options');
    } finally {
      setLoading(false);
    }
  };

  // Custom form handlers
  const handleAddCustomInterest = () => {
    if (customInterestInput.trim() && !customInterests.includes(customInterestInput.trim())) {
      setCustomInterests([...customInterests, customInterestInput.trim()]);
      setCustomInterestInput('');
    }
  };

  const handleRemoveCustomInterest = (index: number) => {
    setCustomInterests(customInterests.filter((_, i) => i !== index));
  };

  const handleGenerateCustomCareerOptions = async () => {
    if (customInterests.length === 0) {
      setError('Please add at least one interest');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }
      
      // Clear old career options to show only latest
      setCareerOptions([]);
      
      // Create a custom profile data based on form inputs only
      const customProfileData = {
        skills: [], // No specific skills from form
        interests: customInterests,
        yearsOfExperience: experienceLevel ? parseInt(experienceLevel) : 0,
        currentRole: '',
        desiredRole: '',
        location: {
          city: customLocation.split(',')[0]?.trim() || '',
          state: customLocation.split(',')[1]?.trim() || '',
          country: customLocation.split(',')[2]?.trim() || customLocation
        },
        workPreferences: {
          workType: '',
          remotePreference: 'no_preference',
          willingToRelocate: false,
          preferredLocations: customLocation ? [customLocation] : []
        },
        salaryExpectations: {
          min: null,
          max: null
        },
        education: [],
        experience: [],
        languages: [],
        summary: referenceJobDescription || '',
        referenceJobDescription: referenceJobDescription
      };

      console.log('Generating careers with custom interests and job description:', customProfileData);

      const options = await generateCareerOptions(
        [], // No specific skills
        customInterests,
        experienceLevel ? parseInt(experienceLevel) : 0,
        customProfileData
      );
      
      await saveCareerOptions(options);
      setCareerOptions(options);
      setLastGenerationMethod('interests');
      
      // Store the custom form data for job finding
      setLastCustomFormData({
        interests: customInterests,
        experienceLevel: experienceLevel ? parseInt(experienceLevel) : 0,
        location: customLocation,
        referenceJobDescription: referenceJobDescription
      });
      
      // Reset form
      setCustomInterests([]);
      setCustomInterestInput('');
      setReferenceJobDescription('');
      setExperienceLevel('');
      setCustomLocation('');
      setShowCustomForm(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `Generated ${options.length} career options based on your interests!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error generating custom career options:', error);
      setError('Failed to generate career options');
    } finally {
      setLoading(false);
    }
  };

  const handleFindJobs = async (careerTitle: string) => {
    try {
      setJobSearchLoading(true);
      setError('');
      setSelectedCareer(careerTitle);
      
      let location = '';
      
      // First check if we have custom form data from the last generation
      if (lastCustomFormData && lastCustomFormData.location) {
        location = lastCustomFormData.location;
      } else if (customLocation) {
        location = customLocation;
      } else {
        // Fall back to profile data
        const preferredLocations = profile?.preferred_locations;
        if (preferredLocations && preferredLocations.length > 0) {
          location = preferredLocations[0];
        } else {
          location = profile?.city || '';
        }
      }

      // Determine country code from profile
      let countryCode = 'us'; // default
      if (profile?.country) {
        const countryMap: { [key: string]: string } = {
          'United States': 'us',
          'USA': 'us',
          'US': 'us',
          'United Kingdom': 'uk',
          'UK': 'uk',
          'India': 'in',
          'Australia': 'au',
          'Canada': 'ca',
          'Germany': 'de',
          'France': 'fr',
          'Spain': 'es',
          'Italy': 'it',
          'Netherlands': 'nl',
          'Brazil': 'br',
          'Mexico': 'mx',
          'Japan': 'jp',
          'South Korea': 'kr',
          'Singapore': 'sg'
        };
        countryCode = countryMap[profile.country] || 'us';
      }

      // Create job search context
      const jobSearchContext = {
        jobTitle: careerTitle,
        location: { city: location },
        workPreferences: { 
          remotePreference: profile?.remote_preference || 'no_preference' 
        },
        profile: { 
          yearsOfExperience: profile?.years_of_experience || 0,
          skills: userSkills,
          interests: userInterests
        },
        countryCode: countryCode // Add country code for Adzuna API
      };

      console.log('Searching for jobs with context:', jobSearchContext);
      console.log('Location being used for search:', location);
      
      const opportunities = await findJobOpportunities(jobSearchContext);
      setJobs(opportunities);
      
      if (opportunities.length === 0) {
        setError('No job opportunities found for this career path. Try adjusting your search criteria.');
      }
    } catch (error) {
      console.error('Error finding jobs:', error);
      setError('Failed to fetch job opportunities. Please try again.');
    } finally {
      setJobSearchLoading(false);
    }
  };

  const handleGenerateCVSuggestions = async (job: JobOpportunity) => {
    try {
      setLoading(true);
      setError('');
      
      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setLoading(false);
        return;
      }
      
      if (!profile) {
        setError('Please complete your profile first');
        return;
      }

      // Create comprehensive CV data including ALL profile fields
      const comprehensiveCVData = {
        personalInfo: {
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
          linkedinUrl: profile.linkedin_url || ''
        },
        professional: {
          currentRole: profile.current_role || '',
          desiredRole: profile.desired_role || '',
          yearsOfExperience: profile.years_of_experience || 0,
          summary: profile.summary || ''
        },
        experience: profile.experience || [],
        education: profile.education || [],
        skills: [...(profile.skills || []), ...userSkills],
        projects: profile.projects || [],
        languages: profile.languages || [],
        preferences: {
          workType: profile.preferred_work_type || '',
          remotePreference: profile.remote_preference || '',
          salaryRange: {
            min: profile.min_salary_expectation || null,
            max: profile.max_salary_expectation || null
          }
        },
        interests: userInterests
      };

      console.log('Generating CV suggestions with comprehensive data:', comprehensiveCVData);

      const suggestions = await generateCVSuggestions(
        JSON.stringify(comprehensiveCVData),
        job
      );
      
      setCvSuggestions(suggestions);
      setSelectedJob(job);
      setShowSuggestions(true);
      // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
      // Add a single button to apply all suggestions
    } catch (error) {
      console.error('Error generating CV suggestions:', error);
      setError('Failed to generate CV suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Remove acceptedSuggestions, rejectedSuggestions, and all Accept/Reject logic
  // Add a single button to apply all suggestions

  const handleUpdateCV = async (updatedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.fullName,
          current_role: updatedData.title,
          email: updatedData.email,
          phone: updatedData.phone,
          city: updatedData.location.split(',')[0]?.trim(),
          state: updatedData.location.split(',')[1]?.trim(),
          country: updatedData.location.split(',')[2]?.trim(),
          summary: updatedData.summary,
          experience: updatedData.experience,
          education: updatedData.education,
          skills: updatedData.skills,
          languages: updatedData.languages
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      // Reload user data to reflect changes
      await loadUserData();
      
      // Show success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV has been successfully updated!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error updating CV:', error);
      setError('Failed to update CV');
    }
  };

  if (!userSkills.length && !userInterests.length && !profile?.current_role) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Complete Your Profile First</h3>
          <p className="text-gray-600 mb-4">
            To get personalized career recommendations, please add your skills, interests, and career information to your profile.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowCustomForm(true)} className="mr-4">
              <Target className="w-4 h-4 mr-2" />
              Generate by Interests
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Or use the custom form to generate careers based on your interests and a reference job description
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSuggestions && cvSuggestions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">CV Optimization for {selectedJob?.title}</h2>
              <p className="text-gray-600 mt-1">at {selectedJob?.company}</p>
            </div>
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              Back to Career Explorer
            </Button>
          </div>
        </div>

        <CVSuggestionManager
          suggestions={cvSuggestions}
          currentData={{
            summary: profile?.summary || '',
            skills: [...userSkills, ...(profile?.skills || [])],
            experience: profile?.experience || [],
            projects: profile?.projects || [],
            education: profile?.education || [],
            languages: profile?.languages || []
          }}
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const ai = cvSuggestions;
                const updates: any = {};
                // Summary
                if (ai.summary) updates.summary = ai.summary;
                // Skills
                if (ai.highlightedSkills) {
                  const currentSkills = profile?.skills || [];
                  const newSkills = [...new Set([...currentSkills, ...ai.highlightedSkills])];
                  updates.skills = newSkills;
                  // Update user_skills table
                  await supabase.from('user_skills').delete().eq('user_id', user.id);
                  if (newSkills.length > 0) {
                    await supabase
                      .from('user_skills')
                      .insert(newSkills.map(skill => ({ user_id: user.id, skill })));
                  }
                }
                // Experience
                if (ai.experienceImprovements && Array.isArray(ai.experienceImprovements)) {
                  const improvedExp = ai.experienceImprovements;
                  const normalize = (str: string) => str?.toLowerCase().replace(/\s+/g, ' ').trim();
                  const newExperience = (profile?.experience || []).map((exp: ExperienceItem) => {
                    // Try exact match
                    let improvement = improvedExp.find((imp: any) =>
                      imp.original && normalize(imp.original) === normalize(exp.description)
                    );
                    // Try substring match
                    if (!improvement) {
                      improvement = improvedExp.find((imp: any) =>
                        imp.original && (
                          normalize(exp.description).includes(normalize(imp.original)) ||
                          normalize(imp.original).includes(normalize(exp.description))
                        )
                      );
                    }
                    if (improvement) {
                      return { ...exp, description: improvement.improved };
                    }
                    return exp;
                  });
                  updates.experience = newExperience;
                  // Also update cv_parsed_data if present
                  if (profile?.cv_parsed_data) {
                    updates.cv_parsed_data = {
                      ...profile.cv_parsed_data,
                      experience: newExperience,
                      // Also update summary in cv_parsed_data
                      summary: ai.summary || profile.cv_parsed_data.summary
                    };
                  }
                } else if (ai.summary && profile?.cv_parsed_data) {
                  // If only summary is updated, also update cv_parsed_data.summary
                  updates.cv_parsed_data = {
                    ...profile.cv_parsed_data,
                    summary: ai.summary
                  };
                }
                // Do NOT update additionalSections/sections
                if (Object.keys(updates).length > 0) {
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);
                  if (updateError) throw updateError;
                }
                await loadUserData();
                setShowSuggestions(false);
                setCvSuggestions(null);
                setSelectedJob(null);
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successDiv.textContent = 'CV optimizations have been successfully applied to your profile!';
                document.body.appendChild(successDiv);
                setTimeout(() => {
                  if (document.body.contains(successDiv)) {
                    document.body.removeChild(successDiv);
                  }
                }, 3000);
              } catch (error) {
                console.error('Error applying suggestions:', error);
                setError('Failed to apply CV optimizations');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            {loading ? 'Applying...' : 'Apply All AI Suggestions'}
          </Button>
        </div>
      </div>
    );
  }

  if (showCVEditor && profile) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">CV Editor</h2>
            <Button variant="outline" onClick={() => setShowCVEditor(false)}>
              Back to Career Explorer
            </Button>
          </div>
        </div>
        <CVEditor
          initialData={{
            fullName: profile.full_name || '',
            title: profile.current_role || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
            summary: profile.summary || '',
            experience: profile.experience || [],
            education: profile.education || [],
            skills: profile.skills || [],
            languages: profile.languages || []
          }}
          onSave={handleUpdateCV}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-8">
        <h2 className="text-2xl font-bold">Career Explorer</h2>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Button 
            onClick={() => setShowCustomForm(true)} 
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Target className="w-4 h-4 mr-2" />
            Generate by Interests
          </Button>
          <Button onClick={handleGenerateCareerOptions} disabled={loading}>
            <Briefcase className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate from Profile'}
          </Button>
        </div>
      </div>

      {/* Custom Interest Form Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Generate Careers by Interests
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Interests Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Interests
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    value={customInterestInput}
                    onChange={(e) => setCustomInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomInterest())}
                    placeholder="e.g., Artificial Intelligence, Web Development, Data Science"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomInterest}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {customInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {interest}
                        <button
                          onClick={() => handleRemoveCustomInterest(index)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {customInterests.length === 0 && (
                  <p className="text-sm text-gray-500">Add at least one interest to generate career options</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Preferred Location (Optional)
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be used for job location preferences
                </p>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience (Optional)
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select experience level</option>
                  <option value="0">Entry Level (0-1 years)</option>
                  <option value="2">Junior (2-3 years)</option>
                  <option value="5">Mid-Level (4-6 years)</option>
                  <option value="8">Senior (7-10 years)</option>
                  <option value="12">Expert (10+ years)</option>
                </select>
              </div>

              {/* Reference Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Job Description (Optional)
                </label>
                <textarea
                  value={referenceJobDescription}
                  onChange={(e) => setReferenceJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Paste a job description that interests you to help generate more targeted career options..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This helps our AI understand the type of roles and requirements you're interested in
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateCustomCareerOptions}
                  disabled={customInterests.length === 0 || loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Career Options'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Summary */}
      {profile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your Profile Summary</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Experience:</span>
              <span className="ml-1 font-medium">{profile.years_of_experience || 0} years</span>
            </div>
            <div>
              <span className="text-gray-500">Current Role:</span>
              <span className="ml-1 font-medium">{profile.current_role || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="ml-1 font-medium">
                {[profile.city, profile.state].filter(Boolean).join(', ') || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Skills:</span>
              <span className="ml-1 font-medium">{userSkills.length} skills</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing your profile and generating personalized career options...</span>
        </div>
      )}

      {careerOptions.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold">Latest Personalized Career Paths</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm text-gray-500">{careerOptions.length} careers</span>
              {renderDeleteButton('all-careers', handleDeleteAllCareers, 'all careers')}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {careerOptions.map((option, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-semibold">{option.title}</h4>
                  {renderDeleteButton(`career-${index}`, () => handleDeleteCareer(index), 'career')}
                </div>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Required Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {option.requiredSkills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Potential Companies</p>
                    <p className="text-gray-700">{option.potentialCompanies.join(', ')}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Salary</p>
                      <p className="text-gray-700">{option.averageSalary}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Growth Potential</p>
                      <p className="text-gray-700">{option.growthPotential}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleFindJobs(option.title)}
                    className="w-full"
                    disabled={jobSearchLoading}
                  >
                    {jobSearchLoading && selectedCareer === option.title ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Latest Jobs
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold">
              Latest Job Opportunities {selectedCareer && `for ${selectedCareer}`}
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm text-gray-500">{jobs.length} jobs found</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobs([])}
              >
                Clear Results
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div key={index} className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow overflow-hidden">
                <div className="text-gray-700 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    {job.companyLogo && (
                      <img src={job.companyLogo} alt={job.company} className="w-12 h-12 rounded-full border flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="break-words">{job.title}</span>
                        {job.seniority && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium self-start sm:self-auto">{job.seniority}</span>
                        )}
                      </h4>
                      <a href={job.companyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline text-sm font-medium break-all">
                        {job.company}
                      </a>
                    </div>
                  </div>
                  {/* <div className="flex flex-wrap gap-4 text-sm mb-2">
                    {job.organizationIndustry && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationIndustry}</span>
                    )}
                    {job.organizationSize && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationSize}</span>
                    )}
                    {job.organizationHeadquarters && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationHeadquarters}</span>
                    )}
                    {job.organizationFollowers && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{job.organizationFollowers.toLocaleString()} followers</span>
                    )}
                    {job.organizationFounded && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">Founded: {job.organizationFounded}</span>
                    )}
                    {job.remote && (
                      <span className="bg-green-100 px-2 py-1 rounded text-green-700">Remote</span>
                    )}
                  </div> */}
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Location:</span> <span className="break-words">{job.location}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Employment Type:</span> <span className="break-words">{job.type}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Posted:</span> <span className="break-words">{job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Salary:</span> <span className="break-words">{job.salary || 'Not specified'}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Company Slogan:</span> <span className="break-words">{job.organizationSlogan}</span>
                  </div>
                  <div className="mb-2 text-gray-600">
                    <span className="font-medium">Description:</span> <span className="break-words">{cleanTruncatedDescription(job.description)}</span>
                  </div>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Specialties:</span>
                      <ul className="list-disc list-inside text-gray-700 ml-4">
                        {job.requirements.map((req, i) => (
                          <li key={i} className="break-words">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.recruiterName && (
                    <div className="mb-2 text-gray-600">
                      <span className="font-medium">Recruiter:</span> <span className="break-words">{job.recruiterName} {job.recruiterTitle && `(${job.recruiterTitle})`}</span>
                      {job.recruiterUrl && (
                        <a href={job.recruiterUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-700 hover:underline break-all">Profile</a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-lg font-semibold break-words">{job.salary}</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    {/* Save Job Button */}
                    <Button
                      onClick={() => saveJob(job)}
                      variant="outline"
                      size="sm"
                      disabled={isJobSaved(job) || savingJob === `${job.title}-${job.company}`}
                      className="w-full sm:w-auto"
                    >
                      {isJobSaved(job) ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 mr-2 text-green-600" />
                          Saved
                        </>
                      ) : savingJob === `${job.title}-${job.company}` ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save Job
                        </>
                      )}
                    </Button>

                    {/* Apply Now Button */}
                    <Button
                      onClick={() => window.open(generateJobApplicationUrl(job), '_blank')}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>

                    {/* CV Optimization Button */}
                    <Button
                      onClick={() => handleGenerateCVSuggestions(job)}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          Optimizing...
                        </>
                      ) : (
                        <>
                      <Brain className="w-4 h-4 mr-2" />
                      Optimize CV
                        </>
                      )}
                    </Button>

                    {/* Generate Learning Path Button */}
                    <Button
                      onClick={() => onGenerateLearningPath(job)}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 w-full sm:w-auto"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create Learning Path
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message when no jobs are loaded */}
      {!jobSearchLoading && jobs.length === 0 && careerOptions.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Find Jobs?</h3>
          <p className="text-gray-600 mb-4">
            Click "Find Latest Jobs" on any career path above to discover current job opportunities.
          </p>
        </div>
      )}
    </div>
  );
}