import { useState, useEffect } from 'react';
import { FileText, Download, Award, Upload, Edit2, Save, X, Trash2, AlertTriangle, TrendingUp, CheckCircle, Zap } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import CVEditor from './CVEditor';
import { uploadCV, parseCV, extractTextFromPdf } from '../lib/pdf';
import { useUser } from '../context/UserContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { backendApi, type CVScore } from '../lib/backendApi';

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
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  custom_sections?: Array<{
    title: string;
    content: string;
    type: 'text' | 'list' | 'experience';
  }>;
  cv_analyses_count?: number;
}

interface UserSkill {
  id: string;
  skill: string;
}

const workPreferences = ['hybrid', 'remote', 'office'];

export default function ProfileSection() {
  const { checkSubscriptionForAI } = useUser();
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

  const [reanalyzingAndSaving, setReanalyzingAndSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cvScore, setCvScore] = useState<CVScore | null>(null);
  const [scoringCV, setScoringCV] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    loadProfile();
    const handlePendingResume = async () => {
      const pendingResumeData = localStorage.getItem('pendingResume');
      const pendingResumeName = localStorage.getItem('pendingResumeName');
      if (pendingResumeData && pendingResumeName) {
        try {
          // Convert base64 back to File
          const base64Response = await fetch(pendingResumeData);
          const blob = await base64Response.blob();
          const file = new File([blob], pendingResumeName, { type: 'application/pdf' });
          // Get user id
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');
          // Process and upload the resume
          await parseCV(file);
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

          // Delete all skills from user_skills table
          await supabase
            .from('user_skills')
            .delete()
            .eq('user_id', user.id);

          // Clear CV-related fields in profile
          // Keep profile fields: full_name, phone, current_role, years_of_experience,
          // remote_preference, preferred_locations, linkedin_url (user entered these in profile form)
          // Clear CV-only fields: email, city, state, country, summary, experience, etc.
          await supabase
            .from('profiles')
            .update({
              cv_url: null,
              cv_parsed_data: null,
              summary: null,
              experience: null,
              projects: null,
              education: null,
              certifications: null,
              custom_sections: null,
              languages: null,
              skills: null,
              email: null,
              city: null,
              state: null,
              country: null
            })
            .eq('id', user.id);

          // Clear CV score from state
          setCvScore(null);
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
        profileUpdate.certifications = parsedCvData.certifications;
        profileUpdate.cv_parsed_data = parsedCvData;
        profileUpdate.cv_analyses_count = (profile?.cv_analyses_count || 0) + 1; // Increment CV analyses count
        
        // Update email and location from CV if not already set
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

      // Update skills - merge user skills with CV skills
      let allSkills: string[] = [];
      
      // Add user-entered skills
      if (formData.skills.trim()) {
        const userSkillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        allSkills = [...allSkills, ...userSkillsArray];
      }
      
      // Add CV parsed skills
      if (parsedCvData?.skills && parsedCvData.skills.length > 0) {
        allSkills = [...allSkills, ...parsedCvData.skills];
      }
        
      // Remove duplicates and update database
      const uniqueSkills = [...new Set(allSkills)];
      
      // Delete existing skills
        await supabase.from('user_skills').delete().eq('user_id', user.id);
        
      // Insert new skills
      if (uniqueSkills.length > 0) {
          const { error: skillsError } = await supabase
            .from('user_skills')
          .insert(uniqueSkills.map(skill => ({ user_id: user.id, skill })));
          
          if (skillsError) throw skillsError;
      }

      await loadProfile();
      setIsEditing(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Profile updated successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to update profile. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleReuploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    try {
      setUploading(true);
      setError('');

      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setUploading(false);
        return;
      }

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
          certifications: parsedData.certifications,
          cv_parsed_data: parsedData,
          // Update email and location from CV if parsed
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

      // Score the CV
      try {
        setScoringCV(true);
        const cvText = await extractTextFromPdf(file);
        if (cvText && cvText.trim()) {
          const scoreResult = await backendApi.scoreCVText(cvText);
          setCvScore(scoreResult);
        }
      } catch (scoreError) {
        console.error('Error scoring CV:', scoreError);
        // Don't fail the upload if scoring fails
      } finally {
        setScoringCV(false);
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV uploaded and analyzed successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error: any) {
      console.error('Error reuploading CV:', error);
      setError(error.message || 'Failed to reupload CV');

      // Show error message with more specific guidance
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';

      let errorMessage = 'Failed to upload CV. Please try again.';
      if (error.message?.includes('image-based') || error.message?.includes('No text could be extracted')) {
        errorMessage = 'Your PDF appears to be image-based. Please use a PDF with selectable text for better results.';
      } else if (error.message?.includes('corrupted') || error.message?.includes('Invalid PDF')) {
        errorMessage = 'The PDF file appears to be corrupted. Please try a different PDF file.';
      } else if (error.message?.includes('too large')) {
        errorMessage = 'PDF file is too large. Please upload a file smaller than 10MB.';
      }

      errorDiv.innerHTML = `
        <div class="font-medium">Upload Failed</div>
        <div class="text-sm mt-1">${errorMessage}</div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 7000);
    } finally {
      setUploading(false);
      // Reset the input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDownloadCV = async () => {
    if (!profile) return;

    try {
      setDownloading(true);
      
      // Find the CV preview element
      const cvPreviewElement = document.getElementById('cv-preview');
      if (!cvPreviewElement) {
        console.error('CV preview element not found');
        throw new Error('CV preview element not found');
      }

      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('CV Element found:', cvPreviewElement);
      console.log('CV Element dimensions:', {
        width: cvPreviewElement.offsetWidth,
        height: cvPreviewElement.offsetHeight,
        scrollWidth: cvPreviewElement.scrollWidth,
        scrollHeight: cvPreviewElement.scrollHeight
      });

      // Use html2canvas to capture the actual rendered CV preview
      const canvas = await html2canvas(cvPreviewElement, {
        scale: 1.5, // Reduced scale for smaller file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvPreviewElement.scrollWidth,
        height: cvPreviewElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging to debug
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        }
      });

      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height
      });

      // Create PDF with custom dimensions to fit all content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, canvas.height * 210 / canvas.width] // Custom height to fit content
      });
      
      // Convert to JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Add image to PDF - full size to fit all content
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, canvas.height * 210 / canvas.width);

      // Download the PDF
      const fullName = profile.cv_parsed_data?.full_name || profile.full_name || 'CV';
      const fileName = `${fullName.replace(/\s+/g, '_')}_CV.pdf`;
      pdf.save(fileName);
      
      console.log('PDF saved successfully');

    } catch (error) {
      console.error('Error generating CV PDF:', error);
      setError('Failed to generate CV PDF');
    } finally {
      setDownloading(false);
    }
  };



  const handleReanalyzeAndSaveCV = async () => {
    if (!profile?.cv_url) return;
    try {
      setReanalyzingAndSaving(true);
      setError('');
      
      // Check subscription for AI features
      if (!checkSubscriptionForAI()) {
        setReanalyzingAndSaving(false);
        return;
      }
      // Get user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Fetch CV file directly from storage using user ID
      let cvFile: File;
      let latestCvFileName: string;
      try {
        console.log('Fetching CV files from storage for user:', user.id);
        
        // List all CV files for this user
        const { data: cvFiles, error: listError } = await supabase.storage
          .from('cvs')
          .list(user.id);
        
        if (listError) {
          console.error('Error listing CV files:', listError);
          throw new Error('Failed to access CV storage. Please try again.');
        }
        
        if (!cvFiles || cvFiles.length === 0) {
          throw new Error('No CV file found in storage. Please upload a CV first.');
        }
        
        // Get the most recent CV file (assuming files are sorted by creation time)
        const latestCvFile = cvFiles[cvFiles.length - 1];
        latestCvFileName = latestCvFile.name;
        console.log('Found CV file:', latestCvFileName);
        
        // Download the CV file
        const { data: cvData, error: downloadError } = await supabase.storage
          .from('cvs')
          .download(`${user.id}/${latestCvFileName}`);
        
        if (downloadError) {
          console.error('Error downloading CV file:', downloadError);
          throw new Error('Failed to download CV file. Please try again.');
        }
        
        // Convert blob to File object
        cvFile = new File([cvData], latestCvFileName, { type: 'application/pdf' });
        console.log('Successfully downloaded CV file:', latestCvFileName);
        
      } catch (storageError) {
        console.error('Error fetching CV from storage:', storageError);
        throw new Error('CV file is no longer accessible. Please re-upload your CV file.');
      }
      
      // Parse the CV using AI
      const parsedData = await parseCV(cvFile);
      
      // Get the public URL for the CV file we just downloaded
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(`${user.id}/${latestCvFileName}`);
      
      // Update the profile with the new parsed data and correct CV URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cv_url: publicUrl,
          summary: parsedData.summary,
          experience: parsedData.experience,
          projects: parsedData.projects,
          education: parsedData.education,
          certifications: parsedData.certifications,
          cv_parsed_data: parsedData,
          cv_analyses_count: (profile?.cv_analyses_count || 0) + 1, // Increment CV analyses count
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
    } catch (error: any) {
      console.error('Error re-analyzing and saving CV:', error);
      
      let errorMessage = 'Failed to re-analyze and save resume. Please try again.';
      let toastMessage = 'Failed to re-analyze CV. Please try again.';
      
      // Provide more specific error messages based on the error type
      if (error.message?.includes('no longer accessible') || error.message?.includes('download URL')) {
        errorMessage = 'CV file is no longer accessible. Please re-upload your CV file.';
        toastMessage = 'CV file expired. Please re-upload your CV file.';
      } else if (error.message?.includes('Invalid PDF structure') || error.message?.includes('corrupted')) {
        errorMessage = 'The CV file appears to be corrupted or invalid. Please try uploading a different PDF file.';
        toastMessage = 'CV file is corrupted. Please upload a valid PDF file.';
      } else if (error.message?.includes('File too large')) {
        errorMessage = 'CV file is too large. Please upload a PDF smaller than 10MB.';
        toastMessage = 'CV file too large. Please upload a smaller PDF.';
      } else if (error.message?.includes('Invalid file type')) {
        errorMessage = 'Invalid file type. Please upload a PDF file.';
        toastMessage = 'Invalid file type. Please upload a PDF file.';
      }
      
      setError(errorMessage);
      
      // Show error message with more specific guidance
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
      
      let displayMessage = toastMessage;
      if (error.message?.includes('image-based') || error.message?.includes('No text could be extracted')) {
        displayMessage = 'Your PDF appears to be image-based. Please use a PDF with selectable text for better results.';
      } else if (error.message?.includes('corrupted') || error.message?.includes('Invalid PDF')) {
        displayMessage = 'The PDF file appears to be corrupted. Please try a different PDF file.';
      }
      
      errorDiv.innerHTML = `
        <div class="font-medium">Re-analysis Failed</div>
        <div class="text-sm mt-1">${displayMessage}</div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 7000);
    } finally {
      setReanalyzingAndSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleEnhanceCV = async () => {
    if (!profile?.cv_url) {
      setError('No CV found. Please upload a CV first.');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setEnhancing(true);
      setError('');

      // Get user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch CV file from storage
      let cvFile: File;
      let cvText: string;
      try {
        console.log('Fetching CV files from storage for user:', user.id);

        // List all CV files for this user
        const { data: cvFiles, error: listError } = await supabase.storage
          .from('cvs')
          .list(user.id);

        if (listError) {
          console.error('Error listing CV files:', listError);
          throw new Error('Failed to access CV storage. Please try again.');
        }

        if (!cvFiles || cvFiles.length === 0) {
          throw new Error('No CV file found in storage. Please upload a CV first.');
        }

        // Get the most recent CV file
        const latestCvFile = cvFiles[cvFiles.length - 1];
        const latestCvFileName = latestCvFile.name;
        console.log('Found CV file:', latestCvFileName);

        // Download the CV file
        const { data: cvData, error: downloadError } = await supabase.storage
          .from('cvs')
          .download(`${user.id}/${latestCvFileName}`);

        if (downloadError) {
          console.error('Error downloading CV file:', downloadError);
          throw new Error('Failed to download CV file. Please try again.');
        }

        // Convert blob to File object
        cvFile = new File([cvData], latestCvFileName, { type: 'application/pdf' });
        console.log('Successfully downloaded CV file:', latestCvFileName);

        // Extract text from CV
        cvText = await extractTextFromPdf(cvFile);
        if (!cvText || !cvText.trim()) {
          throw new Error('Could not extract text from CV. Please ensure your CV is a text-based PDF.');
        }

      } catch (storageError) {
        console.error('Error fetching CV from storage:', storageError);
        throw storageError;
      }

      // Enhance the CV
      console.log('Enhancing CV...');
      const enhancedResult = await backendApi.enhanceCVText(cvText);
      console.log('CV enhanced successfully');

      // Parse the enhanced CV
      console.log('Parsing enhanced CV...');
      const parsedData = await backendApi.analyzeCVText(enhancedResult.enhancedCV);
      console.log('Enhanced CV parsed successfully');

      // Update profile with enhanced data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          summary: parsedData.summary,
          experience: parsedData.experience,
          projects: parsedData.projects,
          education: parsedData.education,
          certifications: parsedData.certifications,
          cv_parsed_data: parsedData,
          languages: parsedData.languages,
          ...(parsedData.full_name && { full_name: parsedData.full_name }),
          ...(parsedData.email && { email: parsedData.email }),
          ...(parsedData.phone && { phone: parsedData.phone }),
          ...(parsedData.city && {
            city: parsedData.city,
            state: parsedData.state,
            country: parsedData.country
          }),
          ...(parsedData.current_role && { current_role: parsedData.current_role }),
          ...(parsedData.years_of_experience && { years_of_experience: parsedData.years_of_experience })
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update skills if available
      if (parsedData.skills && parsedData.skills.length > 0) {
        // Get existing skills
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

      // Score the enhanced CV
      try {
        const scoreResult = await backendApi.scoreCVText(enhancedResult.enhancedCV);
        setCvScore(scoreResult);
      } catch (scoreError) {
        console.error('Error scoring enhanced CV:', scoreError);
        // Don't fail the enhancement if scoring fails
      }

      // Reload profile
      await loadProfile();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV enhanced and applied successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (err: any) {
      console.error('Error enhancing CV:', err);

      let errorMessage = 'Failed to enhance CV. Please try again.';

      if (err.message?.includes('No CV file found') || err.message?.includes('Please upload a CV first')) {
        errorMessage = err.message;
      } else if (err.message?.includes('Could not extract text')) {
        errorMessage = 'Could not extract text from CV. Please ensure your CV is a text-based PDF.';
      } else if (err.message?.includes('Failed to access CV storage')) {
        errorMessage = 'Failed to access CV storage. Please try again.';
      }

      setError(errorMessage);

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
      errorDiv.innerHTML = `
        <div class="font-medium">Enhancement Failed</div>
        <div class="text-sm mt-1">${errorMessage}</div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setEnhancing(false);
    }
  };

  const renderDeleteButton = (dataType: string, label: string, hasData: boolean) => {
    const isConfirming = showDeleteConfirm === dataType;
    const isDeleting = deleting === dataType;

    if (!hasData) return null;

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Profile</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
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
              <p className="text-sm text-yellow-700 mt-1 break-words">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <div className="col-span-1 lg:col-span-2">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">CV & Summary</h3>
                      <p className="text-sm text-gray-600 mt-1">Manage your resume and professional summary</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
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
                      <Button variant="outline" size="sm" disabled={uploading} className="min-w-[120px]">
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload CV'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* CV Actions Row */}
                {profile.cv_url && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={profile.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Original CV
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCV}
                        disabled={downloading || !profile || (!profile.cv_url && !profile.cv_parsed_data && !profile.full_name)}
                        className="min-w-[140px]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloading ? 'Generating PDF...' : 'Download CV'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* CV Enhancement Loading */}
              {enhancing && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-blue-800 font-medium">Enhancing your CV and applying changes...</p>
                  </div>
                </div>
              )}

              {/* CV Score Section */}
              {scoringCV && !enhancing && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-blue-800 font-medium">Analyzing your CV...</p>
                  </div>
                </div>
              )}

              {cvScore && !scoringCV && (
                <div className="bg-white rounded-lg border-2 border-blue-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-xl font-bold">Your CV Score</h3>
                    </div>
                    <Button
                      onClick={handleEnhanceCV}
                      size="sm"
                      disabled={enhancing}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enhancing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Enhance CV
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-6 gap-6">
                    {/* Overall Score */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(cvScore.overallScore)} border-4 ${cvScore.overallScore >= 80 ? 'border-green-600' : cvScore.overallScore >= 60 ? 'border-yellow-600' : 'border-red-600'}`}>
                        <span className={`text-4xl font-bold ${getScoreColor(cvScore.overallScore)}`}>
                          {cvScore.overallScore}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mt-2">Overall Score</p>
                      <p className="text-xs text-gray-500">
                        {cvScore.overallScore >= 80 ? 'Excellent' : cvScore.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                      </p>
                    </div>

                    {/* Detailed Scores */}
                    <div className="md:col-span-4 space-y-3">
                      {Object.entries(cvScore.scores).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-900 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className={`font-bold ${getScoreColor(value)}`}>
                              {value}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                value >= 80 ? 'bg-green-600' : value >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths and Recommendations */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {cvScore.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {cvScore.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="text-xs text-green-800 flex items-start">
                              <span className="text-green-600 mr-1 font-bold">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cvScore.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                          <Zap className="w-4 h-4 text-blue-600 mr-2" />
                          Top Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {cvScore.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="text-xs text-blue-800 flex items-start">
                              <span className="text-blue-600 mr-1 font-bold">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
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
                    projects: profile.cv_parsed_data?.projects || profile.projects || [],
                    education: profile.cv_parsed_data?.education || profile.education || [],
                    skills: userSkills.map(s => s.skill).concat(profile.cv_parsed_data?.skills || profile.skills || []).filter((skill, index, arr) => arr.indexOf(skill) === index),
                    languages: profile.cv_parsed_data?.languages || profile.languages || [],
                    certifications: profile.certifications || profile.cv_parsed_data?.certifications || [],
                    awards: profile.cv_parsed_data?.awards || [], // Keep for backward compatibility
                    publications: profile.cv_parsed_data?.publications || [], // Keep for backward compatibility
                    volunteerWork: profile.cv_parsed_data?.volunteerWork || [], // Keep for backward compatibility
                    customSections: (profile.custom_sections || []).map(section => ({
                      ...section,
                      type: section.type || 'text'
                    }))
                  }}
                  userType={(profile as any).user_type}
                  profileData={profile}
                  onSave={async (data) => {
                    try {
                      // Combine awards with certifications since we don't have an awards column
                      const combinedCertifications = [
                        ...(data.certifications || []),
                        ...(data.awards || []).map((award: any) => ({
                          name: award.title || award.name,
                          issuer: award.issuer,
                          date: award.date
                        }))
                      ];

                      // Combine publications and volunteer work with custom sections
                      const combinedCustomSections = [
                        ...(data.customSections || []),
                        ...(data.publications || []).map((pub: any) => ({
                          title: 'Publications',
                          content: `${pub.title} - ${pub.publisher || pub.journal || 'Published'} (${pub.date || 'Date not specified'})`,
                          type: 'text' as const
                        })),
                        ...(data.volunteerWork || []).map(vol => ({
                          title: 'Volunteer Work',
                          content: `${vol.role} at ${vol.organization} - ${vol.duration || 'Duration not specified'}. ${vol.description || ''}`,
                          type: 'text'
                        }))
                      ];

                      // Update cv_parsed_data to keep it in sync with manual edits
                      const updatedCvParsedData = {
                        ...(profile.cv_parsed_data || {}),
                        full_name: data.fullName,
                        current_role: data.title,
                        email: data.email,
                        phone: data.phone,
                        summary: data.summary,
                        experience: data.experience,
                        education: data.education,
                        skills: data.skills,
                        languages: data.languages,
                        certifications: combinedCertifications,
                        projects: data.projects
                      };

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
                          languages: data.languages,
                          certifications: combinedCertifications,
                          projects: data.projects,
                          custom_sections: combinedCustomSections,
                          cv_parsed_data: updatedCvParsedData
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


          </div>
        )
      )}
      </div>
    </div>
  );
}