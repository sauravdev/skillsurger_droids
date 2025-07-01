import { useState, useEffect } from 'react';
import { FileText, Download, Award, Briefcase, GraduationCap, Brain, Upload, MapPin, Building, Edit2, Save, X, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import CVEditor from './CVEditor';
import { uploadCV, parseCV, downloadCV } from '../lib/pdf';

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  current_role: string;
  years_of_experience: number;
  remote_preference: string;
  preferred_locations: string[];
  linkedin_url: string;
  cv_url: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  email?: string;
  languages?: string[];
  city?: string;
  state?: string;
  country?: string;
  cv_parsed_data?: any;
}

interface UserSkill {
  id: string;
  skill: string;
}

const workPreferences = ['hybrid', 'remote', 'office'];

export default function ProfileSection() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    currentRole: '',
    yearsOfExperience: '',
    workPreference: '',
    preferredLocations: '',
    linkedinUrl: '',
    skills: '',
    cv: null as File | null
  });
  const [isUploadingPendingResume, setIsUploadingPendingResume] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzingAndSaving, setReanalyzingAndSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    const handlePendingResume = async () => {
      const pendingResumeData = localStorage.getItem('pendingResume');
      const pendingResumeName = localStorage.getItem('pendingResumeName');
      if (pendingResumeData && pendingResumeName) {
        try {
          setIsUploadingPendingResume(true);
          // Convert base64 back to File
          const base64Response = await fetch(pendingResumeData);
          const blob = await base64Response.blob();
          const file = new File([blob], pendingResumeName, { type: 'application/pdf' });
          // Get user id
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');
          // Process and upload the resume
          const parsedCV = await parseCV(file);
          await uploadCV(file, user.id);
          // Optionally update profile with parsedCV data here if needed
          // Clear from localStorage after successful upload
          localStorage.removeItem('pendingResume');
          localStorage.removeItem('pendingResumeName');
          // Show success message or update UI as needed
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successDiv.textContent = 'Resume uploaded successfully!';
          document.body.appendChild(successDiv);
          setTimeout(() => {
            if (document.body.contains(successDiv)) {
              document.body.removeChild(successDiv);
            }
          }, 3000);
        } catch (error) {
          console.error('Error processing pending resume:', error);
          const errorDiv = document.createElement('div');
          errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          errorDiv.textContent = 'Failed to process resume. Please try uploading again.';
          document.body.appendChild(errorDiv);
          setTimeout(() => {
            if (document.body.contains(errorDiv)) {
              document.body.removeChild(errorDiv);
            }
          }, 3000);
        } finally {
          setIsUploadingPendingResume(false);
        }
      }
    };
    handlePendingResume();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      
      // Update form data with profile data (only basic fields)
      setFormData({
        fullName: profileData.full_name || '',
        phone: profileData.phone || '',
        currentRole: profileData.current_role || '',
        yearsOfExperience: profileData.years_of_experience?.toString() || '0',
        workPreference: profileData.remote_preference || 'hybrid',
        preferredLocations: Array.isArray(profileData.preferred_locations) ? profileData.preferred_locations.join(', ') : '',
        linkedinUrl: profileData.linkedin_url || '',
        skills: '',
        cv: null
      });

      const { data: skills } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id);

      setUserSkills(skills || []);
      
      // Update skills in form data
      if (skills && skills.length > 0) {
        setFormData(prev => ({
          ...prev,
          skills: skills.map(s => s.skill).join(', ')
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteData = async (dataType: string) => {
    if (showDeleteConfirm !== dataType) {
      setShowDeleteConfirm(dataType);
      return;
    }

    try {
      setDeleting(dataType);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      switch (dataType) {
        case 'cv':
          // Delete CV file from storage
          const { data: files } = await supabase.storage
            .from('cvs')
            .list(user.id);

          if (files && files.length > 0) {
            const filePaths = files.map(file => `${user.id}/${file.name}`);
            await supabase.storage
              .from('cvs')
              .remove(filePaths);
          }

          // Clear CV-related fields in profile
          await supabase
            .from('profiles')
            .update({
              cv_url: null,
              cv_parsed_data: null,
              summary: null,
              experience: null,
              projects: null,
              education: null
            })
            .eq('id', user.id);
          break;

        case 'skills':
          await supabase
            .from('user_skills')
            .delete()
            .eq('user_id', user.id);
          break;

        default:
          throw new Error('Unknown data type');
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `${dataType.replace('_', ' ')} deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

      await loadProfile();
      setShowDeleteConfirm(null);

    } catch (error: any) {
      console.error('Error deleting data:', error);
      setError(error.message || `Failed to delete ${dataType}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let cvUrl = profile?.cv_url || '';
      let parsedCvData = null;

      if (formData.cv) {
        parsedCvData = await parseCV(formData.cv);
        cvUrl = await uploadCV(formData.cv, user.id);
      }

      // Update profile with basic info only
      const profileUpdate: any = {
        full_name: formData.fullName,
        phone: formData.phone,
        current_role: formData.currentRole,
        years_of_experience: parseInt(formData.yearsOfExperience) || 0,
        remote_preference: formData.workPreference,
        preferred_locations: formData.preferredLocations.split(',').map(loc => loc.trim()).filter(Boolean),
        linkedin_url: formData.linkedinUrl
      };

      // If CV was uploaded, add parsed data to CV-specific fields
      if (parsedCvData) {
        profileUpdate.cv_url = cvUrl;
        profileUpdate.summary = parsedCvData.summary;
        profileUpdate.experience = parsedCvData.experience;
        profileUpdate.projects = parsedCvData.projects;
        profileUpdate.education = parsedCvData.education;
        profileUpdate.cv_parsed_data = parsedCvData;
        
        // Update email and location from CV if not already set
        if (parsedCvData.email && !profile?.email) {
          profileUpdate.email = parsedCvData.email;
        }
        if (parsedCvData.city && !profile?.city) {
          profileUpdate.city = parsedCvData.city;
          profileUpdate.state = parsedCvData.state;
          profileUpdate.country = parsedCvData.country;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update skills
      if (formData.skills.trim()) {
        const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        
        // Delete existing skills
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        
        // Insert new skills
        if (skillsArray.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(skillsArray.map(skill => ({ user_id: user.id, skill })));
          
          if (skillsError) throw skillsError;
        }
      }

      // If CV was parsed and had skills, merge them with user skills
      if (parsedCvData?.skills && parsedCvData.skills.length > 0) {
        const existingSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        const allSkills = [...new Set([...existingSkills, ...parsedCvData.skills])];
        
        // Delete existing skills and insert merged skills
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        
        if (allSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(allSkills.map(skill => ({ user_id: user.id, skill })));
          
          if (skillsError) throw skillsError;
        }
      }

      await loadProfile();
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleReuploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    try {
      setUploading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const file = e.target.files[0];
      
      // First parse the CV to ensure it's valid
      const parsedData = await parseCV(file);
      
      // Then upload it and get the URL
      const cvUrl = await uploadCV(file, user.id);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cv_url: cvUrl,
          summary: parsedData.summary,
          experience: parsedData.experience,
          projects: parsedData.projects,
          education: parsedData.education,
          cv_parsed_data: parsedData,
          // Update email and location from CV if parsed
          ...(parsedData.email && { email: parsedData.email }),
          ...(parsedData.city && { 
            city: parsedData.city,
            state: parsedData.state,
            country: parsedData.country
          })
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Merge CV skills with existing skills
      if (parsedData.skills && parsedData.skills.length > 0) {
        const { data: existingSkills } = await supabase
          .from('user_skills')
          .select('skill')
          .eq('user_id', user.id);

        const currentSkills = existingSkills?.map(s => s.skill) || [];
        const allSkills = [...new Set([...currentSkills, ...parsedData.skills])];
        
        // Delete existing skills and insert merged skills
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        
        if (allSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(allSkills.map(skill => ({ user_id: user.id, skill })));
          
          if (skillsError) throw skillsError;
        }
      }
      
      await loadProfile();
    } catch (error: any) {
      console.error('Error reuploading CV:', error);
      setError(error.message || 'Failed to reupload CV');
    } finally {
      setUploading(false);
      // Reset the input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDownloadCV = async () => {
    if (!profile?.cv_url) return;

    try {
      const filename = `${profile.full_name.replace(/\s+/g, '_')}_CV.pdf`;
      await downloadCV(profile.cv_url, filename);
    } catch (error: any) {
      setError(error.message || 'Failed to download CV');
    }
  };

  const handleReanalyzeCV = async () => {
    if (!profile?.cv_url) return;
    try {
      setReanalyzing(true);
      setError('');
      // Download the PDF file from the URL
      const response = await fetch(profile.cv_url);
      const blob = await response.blob();
      const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
      // Parse the CV using AI
      const parsedData = await parseCV(file);
      // Update the profile with the new parsed data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          summary: parsedData.summary,
          experience: parsedData.experience,
          projects: parsedData.projects,
          education: parsedData.education,
          cv_parsed_data: parsedData,
          ...(parsedData.city && { 
            city: parsedData.city,
            state: parsedData.state,
            country: parsedData.country
          })
        })
        .eq('id', user.id);
      if (updateError) throw updateError;
      // Merge CV skills with existing skills
      if (parsedData.skills && parsedData.skills.length > 0) {
        const { data: existingSkills } = await supabase
          .from('user_skills')
          .select('skill')
          .eq('user_id', user.id);
        const currentSkills = existingSkills?.map(s => s.skill) || [];
        const allSkills = [...new Set([...currentSkills, ...parsedData.skills])];
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        if (allSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(allSkills.map(skill => ({ user_id: user.id, skill })));
          if (skillsError) throw skillsError;
        }
      }
      await loadProfile();
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Resume re-analyzed and profile updated!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Error re-analyzing CV:', error);
      setError('Failed to re-analyze resume. Please try again.');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleReanalyzeAndSaveCV = async () => {
    if (!profile?.cv_url) return;
    try {
      setReanalyzingAndSaving(true);
      setError('');
      // Download the PDF file from the URL
      const response = await fetch(profile.cv_url);
      const blob = await response.blob();
      const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
      // Parse the CV using AI
      const parsedData = await parseCV(file);
      // Get user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      // Upload the file again (to update timestamp or replace)
      const cvUrl = await uploadCV(file, user.id);
      // Update the profile with the new parsed data and file URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cv_url: cvUrl,
          summary: parsedData.summary,
          experience: parsedData.experience,
          projects: parsedData.projects,
          education: parsedData.education,
          cv_parsed_data: parsedData,
          ...(parsedData.city && { 
            city: parsedData.city,
            state: parsedData.state,
            country: parsedData.country
          })
        })
        .eq('id', user.id);
      if (updateError) throw updateError;
      // Merge CV skills with existing skills
      if (parsedData.skills && parsedData.skills.length > 0) {
        const { data: existingSkills } = await supabase
          .from('user_skills')
          .select('skill')
          .eq('user_id', user.id);
        const currentSkills = existingSkills?.map(s => s.skill) || [];
        const allSkills = [...new Set([...currentSkills, ...parsedData.skills])];
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        if (allSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
            .insert(allSkills.map(skill => ({ user_id: user.id, skill })));
          if (skillsError) throw skillsError;
        }
      }
      await loadProfile();
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Resume re-analyzed, saved, and profile updated!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Error re-analyzing and saving CV:', error);
      setError('Failed to re-analyze and save resume. Please try again.');
    } finally {
      setReanalyzingAndSaving(false);
    }
  };

  const renderDeleteButton = (dataType: string, label: string, hasData: boolean) => {
    const isConfirming = showDeleteConfirm === dataType;
    const isDeleting = deleting === dataType;

    if (!hasData) return null;

    return (
      <div className="flex items-center space-x-2">
        {!isConfirming ? (
          <Button
            onClick={() => handleDeleteData(dataType)}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete {label}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-red-600">Confirm delete?</span>
            <Button
              onClick={() => handleDeleteData(dataType)}
              disabled={isDeleting}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
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
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Profile</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                setIsEditing(false);
                setError('');
              }} 
              variant="outline" 
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile} 
              size="sm"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Delete Warning */}
      {!isEditing && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Data Management</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You can delete specific sections of your profile data using the delete buttons below. 
                <strong> Deletions are permanent and cannot be undone.</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Role</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Preference</label>
                <select
                  value={formData.workPreference}
                  onChange={(e) => setFormData({ ...formData, workPreference: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select work preference</option>
                  {workPreferences.map(pref => (
                    <option key={pref} value={pref}>
                      {pref.charAt(0).toUpperCase() + pref.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Locations</label>
                <input
                  type="text"
                  value={formData.preferredLocations}
                  onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., New York, Remote, San Francisco"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Skills</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., JavaScript, Python, React"
              />
            </div>
          </div>

          {/* CV Upload */}
          <div>
            <h3 className="text-lg font-semibold mb-4">CV Upload</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload New CV (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, cv: e.target.files?.[0] || null })}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload a PDF CV to automatically extract and populate your profile information.
              </p>
            </div>
          </div>
        </form>
      ) : (
        profile && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-gray-900">{profile.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{profile.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Role</p>
                  <p className="text-gray-900">{profile.current_role || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years of Experience</p>
                  <p className="text-gray-900">{profile.years_of_experience || 0} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Work Preference</p>
                  <p className="text-gray-900">
                    {profile.remote_preference
                      ? profile.remote_preference.charAt(0).toUpperCase() + profile.remote_preference.slice(1)
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Preferred Locations</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.preferred_locations?.length > 0 ? (
                      profile.preferred_locations.map((location, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {location}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-900">Not set</span>
                    )}
                  </div>
                </div>
                {profile.linkedin_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">LinkedIn Profile</p>
                    <a 
                      href={profile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Skills
                </h3>
                <div className="flex space-x-2">
                  {renderDeleteButton('skills', 'Skills', userSkills.length > 0)}
                </div>
              </div>
              <div className="space-y-4">
                {userSkills.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {userSkills.map(skill => (
                        <span key={skill.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill.skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No skills added yet</p>
                )}
              </div>
            </div>

            {/* CV and Summary Section - All parsed data goes here */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  CV & Summary
                </h3>
                <div className="flex items-center space-x-2">
                  {renderDeleteButton('cv', 'CV', !!profile.cv_url)}
                  <div className="relative">
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleReuploadCV}
                      disabled={uploading}
                    />
                    <Button variant="outline" size="sm" disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload CV'}
                    </Button>
                  </div>
                  {profile.cv_url && (
                    <div className="flex space-x-2">
                      <a
                        href={profile.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View CV
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReanalyzeAndSaveCV}
                        disabled={reanalyzingAndSaving || uploading}
                        className="flex items-center"
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-green-600" />
                        {reanalyzingAndSaving ? 'Analyzing & Saving...' : 'Re-analyze and Save Resume with AI'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Parsed CV Information */}
              {profile.cv_parsed_data?.email && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Email (from CV)</p>
                  <p className="text-gray-700">{profile.cv_parsed_data.email}</p>
                </div>
              )}

              {(profile.cv_parsed_data?.city || profile.cv_parsed_data?.state || profile.cv_parsed_data?.country) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Location (from CV)</p>
                  <p className="text-gray-700">
                    {[profile.cv_parsed_data.city, profile.cv_parsed_data.state, profile.cv_parsed_data.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {profile.cv_parsed_data?.summary ? (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Summary</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{profile.cv_parsed_data.summary}</p>
                </div>
              ) : profile.summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Summary</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{profile.summary}</p>
                </div>
              )}
              
              {profile && (
                <CVEditor
                  initialData={{
                    fullName: profile.cv_parsed_data?.full_name || profile.full_name || '',
                    title: profile.cv_parsed_data?.current_role || profile.current_role || '',
                    email: profile.cv_parsed_data?.email || profile.email || '',
                    phone: profile.cv_parsed_data?.phone || profile.phone || '',
                    location: [profile.cv_parsed_data?.city || profile.city, profile.cv_parsed_data?.state || profile.state, profile.cv_parsed_data?.country || profile.country].filter(Boolean).join(', '),
                    summary: profile.cv_parsed_data?.summary || profile.summary || '',
                    experience: profile.cv_parsed_data?.experience || profile.experience || [],
                    education: profile.cv_parsed_data?.education || profile.education || [],
                    skills: profile.cv_parsed_data?.skills || profile.skills || [],
                    languages: profile.cv_parsed_data?.languages || profile.languages || []
                  }}
                  onSave={async (data) => {
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({
                          full_name: data.fullName,
                          current_role: data.title,
                          email: data.email,
                          phone: data.phone,
                          summary: data.summary,
                          experience: data.experience,
                          education: data.education,
                          skills: data.skills,
                          languages: data.languages
                        })
                        .eq('id', profile.id);

                      if (error) throw error;
                      
                      await loadProfile();
                    } catch (error) {
                      console.error('Error updating profile:', error);
                      setError('Failed to update profile');
                    }
                  }}
                  hideSummaryInPreview={!!(profile.cv_parsed_data?.summary || profile.summary)}
                />
              )}
            </div>

            {/* Experience Section - Only show if data exists */}
            {profile.experience?.length > 0 && (
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                    Professional Experience (from CV)
                  </h3>
                </div>
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 bg-gray-50 p-4 rounded-r-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{exp.title}</h4>
                          <p className="text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-500">{exp.duration}</span>
                      </div>
                      <p className="mt-2 text-gray-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Section - Only show if data exists */}
            {profile.projects?.length > 0 && (
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-600" />
                    Projects (from CV)
                  </h3>
                </div>
                <div className="space-y-4">
                  {profile.projects.map((project, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="mt-2 text-gray-600">{project.description}</p>
                      {project.technologies && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Section - Only show if data exists */}
            {profile.education?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                    Education (from CV)
                  </h3>
                </div>
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 bg-gray-50 p-4 rounded-r-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-gray-500">{edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}