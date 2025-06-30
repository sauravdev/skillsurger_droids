import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, ExternalLink, RefreshCw, Trash2, Archive, AlertTriangle, ChevronDown, ChevronUp, Star, Clock, DollarSign, Award, Shield } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { generateLearningPlan } from '../lib/openai';

interface LearningPath {
  id: string;
  career_path: string;
  job_title: string;
  skills_to_learn: string[];
  resources: Array<{
    type: string;
    title: string;
    url: string;
    description: string;
    completed?: boolean;
    verified?: boolean;
    fallbackUrl?: string;
    completedAt?: string;
    timeSpent?: number;
    price?: string;
    rating?: number;
    provider?: string;
    difficulty?: string;
    duration?: string;
  }>;
  progress: number;
  created_at: string;
}

interface SavedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
}

interface Career {
  title: string;
  jobs: SavedJob[];
}

interface JobOpportunity {
  title: string;
  description: string;
  requirements: string[];
}

interface LearningPathsProps {
  job: JobOpportunity | null;
}

export default function LearningPaths({ job }: LearningPathsProps) {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [historicalPaths, setHistoricalPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [careers, setCareers] = useState<Career[]>([]);
  const [allJobs, setAllJobs] = useState<SavedJob[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (job) {
      handleGenerateLearningPath(job);
    }
  }, [job]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load careers and jobs
      const [{ data: careerData }, { data: jobData }] = await Promise.all([
        supabase.from('generated_careers').select('title').eq('user_id', user.id),
        supabase.from('saved_jobs').select('id, title, company, description, requirements').eq('user_id', user.id)
      ]);

      console.log('Loaded career data:', careerData);
      console.log('Loaded job data:', jobData);

      if (jobData) {
        setAllJobs(jobData);
      }

      if (careerData && jobData) {
        // Create career objects with their related jobs
        const uniqueCareers = Array.from(new Set(careerData.map(c => c.title)));
        const careersWithJobs: Career[] = uniqueCareers.map(careerTitle => {
          // Find jobs that are related to this career
          const relatedJobs = jobData.filter(job => {
            const careerWords = careerTitle.toLowerCase().split(' ');
            const jobTitle = job.title.toLowerCase();
            const jobDescription = job.description.toLowerCase();
            
            // Check if any career words appear in job title or description
            return careerWords.some(word => 
              word.length > 3 && (jobTitle.includes(word) || jobDescription.includes(word))
            );
          });

          return {
            title: careerTitle,
            jobs: relatedJobs
          };
        });

        // Also add a "All Jobs" category that includes all saved jobs
        careersWithJobs.unshift({
          title: 'All Saved Jobs',
          jobs: jobData
        });

        setCareers(careersWithJobs);
        console.log('Processed careers with jobs:', careersWithJobs);
      }

      // Load learning paths
      const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paths) {
        // Separate recent and historical paths
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPaths = paths.filter(path => 
          new Date(path.created_at) >= thirtyDaysAgo
        );
        
        const historicalPathsData = paths.filter(path => 
          new Date(path.created_at) < thirtyDaysAgo
        );

        setLearningPaths(recentPaths);
        setHistoricalPaths(historicalPathsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePath = async (pathId: string, isHistorical = false) => {
    const deleteKey = `path-${pathId}`;
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from database
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('id', pathId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      if (isHistorical) {
        setHistoricalPaths(prev => prev.filter(path => path.id !== pathId));
      } else {
        setLearningPaths(prev => prev.filter(path => path.id !== pathId));
      }
      
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Learning path deleted successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting learning path:', error);
      setError(error.message || 'Failed to delete learning path');
    } finally {
      setDeleting(null);
    }
  };

  const handleArchivePath = async (pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Move to historical by updating created_at to be older than 30 days
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const { error } = await supabase
        .from('learning_paths')
        .update({ created_at: oldDate.toISOString() })
        .eq('id', pathId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Move from current to historical in local state
      const pathToMove = learningPaths.find(path => path.id === pathId);
      if (pathToMove) {
        setLearningPaths(prev => prev.filter(path => path.id !== pathId));
        setHistoricalPaths(prev => [{ ...pathToMove, created_at: oldDate.toISOString() }, ...prev]);
      }

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Learning path archived successfully!';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error archiving learning path:', error);
      setError(error.message || 'Failed to archive learning path');
    }
  };

  const handleDeleteAllPaths = async (isHistorical = false) => {
    const deleteKey = isHistorical ? 'all-historical-paths' : 'all-recent-paths';
    
    if (showDeleteConfirm !== deleteKey) {
      setShowDeleteConfirm(deleteKey);
      return;
    }

    try {
      setDeleting(deleteKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pathsToDelete = isHistorical ? historicalPaths : learningPaths;
      const pathIds = pathsToDelete.map(path => path.id);

      if (pathIds.length === 0) return;

      // Delete from database
      const { error } = await supabase
        .from('learning_paths')
        .delete()
        .eq('user_id', user.id)
        .in('id', pathIds);

      if (error) throw error;

      // Update local state
      if (isHistorical) {
        setHistoricalPaths([]);
      } else {
        setLearningPaths([]);
      }
      
      setShowDeleteConfirm(null);

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = `All ${isHistorical ? 'historical' : 'recent'} learning paths deleted successfully!`;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Error deleting all learning paths:', error);
      setError(error.message || 'Failed to delete all learning paths');
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

  async function handleGenerateLearningPath(selectedJob: JobOpportunity) {
    if (!selectedJob) {
      setError('Please select a job first to generate a learning path.');
      return;
    }

    try {
      setGeneratingPlan(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const plan = await generateLearningPlan(
        selectedJob.title, 
        selectedJob.description, 
        selectedJob.requirements
      );

      // Save the new path to the database
      const { data: savedPath, error: saveError } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          career_path: selectedJob.title, // Use job title as career path for now
          job_title: selectedJob.title,
          skills_to_learn: selectedJob.requirements, // Use job requirements for skills to learn
          resources: plan,
          progress: 0,
        })
        .select()
        .single();
        
      if (saveError) throw saveError;

      // Add new path to the top of the list
      setLearningPaths(prev => [savedPath, ...prev]);
      
    } catch (error: any) {
      console.error('Error generating learning path:', error);
      setError(error.message || 'Failed to generate learning path');
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleUpdateProgress(pathId: string, newProgress: number) {
    try {
      const { error: updateError } = await supabase
        .from('learning_paths')
        .update({ progress: newProgress })
        .eq('id', pathId);

      if (updateError) throw updateError;

      setLearningPaths(prev =>
        prev.map(path =>
          path.id === pathId ? { ...path, progress: newProgress } : path
        )
      );
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress');
    }
  }

  const getPriceColor = (price: string) => {
    switch (price?.toLowerCase()) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'freemium': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!job && learningPaths.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Learning Path Generated</h3>
        <p className="text-gray-600">
          Select a job from the "Career Explorer" to generate a personalized learning path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Generate New Learning Path */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
          Generate Verified Learning Path
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Enhanced Link Verification</h4>
              <p className="text-sm text-blue-700 mt-1">
                All learning resources are now verified for availability and quality. We prioritize free and low-cost options from trusted educational platforms.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Career Path</label>
            <select
              value={selectedCareer}
              onChange={(e) => {
                setSelectedCareer(e.target.value);
                setSelectedJob('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a career path</option>
              {careers.map(career => (
                <option key={career.title} value={career.title}>
                  {career.title} ({career.jobs.length} jobs)
                </option>
              ))}
            </select>
          </div>

          {selectedCareer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a job title</option>
                {careers
                  .find(c => c.title === selectedCareer)
                  ?.jobs.map(job => {
                    const jobDisplayName = `${job.title} at ${job.company}`;
                    return (
                      <option key={job.id} value={jobDisplayName}>
                        {jobDisplayName}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          {selectedCareer && careers.find(c => c.title === selectedCareer)?.jobs.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                No saved jobs found for this career path. Please save some jobs in the Career Explorer first, or select "All Saved Jobs" to see all available positions.
              </p>
            </div>
          )}

          <Button
            onClick={() => handleGenerateLearningPath(job)}
            disabled={!selectedCareer || !selectedJob || generatingPlan}
            className="w-full"
          >
            {generatingPlan ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Verified Learning Path...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Verified Learning Path
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Recent Learning Paths */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Recent Learning Paths (Last 30 Days)
          </h3>
          {learningPaths.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{learningPaths.length} paths</span>
              {renderDeleteButton('all-recent-paths', () => handleDeleteAllPaths(false), 'all recent paths')}
            </div>
          )}
        </div>
        
        {learningPaths.length > 0 ? (
          <div className="space-y-6">
            {learningPaths.map(path => (
              <div key={path.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">{path.job_title}</h4>
                    <p className="text-gray-600">{path.career_path}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(path.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Progress:</span>
                      <span className="font-medium ml-1">{path.progress}%</span>
                      <span className="text-xs text-gray-500 block">
                        ({path.resources.filter(r => r.completed).length}/{path.resources.length} courses)
                      </span>
                      {path.progress === 100 && (
                        <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button
                        onClick={() => handleArchivePath(path.id)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                      {renderDeleteButton(`path-${path.id}`, () => handleDeletePath(path.id, false), 'path')}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${path.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {path.skills_to_learn.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-green-600" />
                    Verified Learning Resources
                  </h5>
                  {path.resources.map((resource, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-colors ${
                        resource.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 flex-wrap gap-2">
                            <h6 className="font-medium">{resource.title}</h6>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {resource.type}
                            </span>
                            {resource.verified && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </span>
                            )}
                            {resource.price && (
                              <span className={`px-2 py-1 rounded text-xs ${getPriceColor(resource.price)}`}>
                                {resource.price}
                              </span>
                            )}
                            {resource.difficulty && (
                              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                {resource.difficulty}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                          
                          {/* Resource metadata */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            {resource.provider && (
                              <span className="flex items-center">
                                <Award className="w-3 h-3 mr-1" />
                                {resource.provider}
                              </span>
                            )}
                            {resource.rating && (
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                {resource.rating}/5
                              </span>
                            )}
                            {resource.duration && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {resource.duration}
                              </span>
                            )}
                          </div>
                          
                          {resource.completed && resource.completedAt && (
                            <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                              ✅ Completed on {new Date(resource.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center bg-blue-50 px-3 py-1 rounded"
                            >
                              Access Course/Resource
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </a>
                            {resource.fallbackUrl && (
                              <a
                                href={resource.fallbackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:underline text-sm flex items-center bg-gray-50 px-3 py-1 rounded"
                              >
                                Alternative Link
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updatedResources = [...path.resources];
                            updatedResources[index] = {
                              ...updatedResources[index],
                              completed: !updatedResources[index].completed,
                              completedAt: !updatedResources[index].completed ? new Date().toISOString() : undefined
                            };
                            
                            const completedCount = updatedResources.filter(r => r.completed).length;
                            const newProgress = Math.round((completedCount / updatedResources.length) * 100);
                            
                            handleUpdateProgress(path.id, newProgress);
                            
                            // Update local state
                            setLearningPaths(prev =>
                              prev.map(p =>
                                p.id === path.id 
                                  ? { ...p, resources: updatedResources, progress: newProgress }
                                  : p
                              )
                            );
                          }}
                          className={`p-2 rounded-full transition-colors ml-4 ${
                            resource.completed 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={resource.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {path.progress === 100 && (
                  <div className="mt-6 flex items-center justify-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <span className="text-green-600 font-medium">Learning Path Completed! 🎉</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Learning Paths</h3>
            <p className="text-gray-600 mb-4">
              Generate your first verified learning path to get started
            </p>
            <p className="text-sm text-gray-500">
              Make sure you have saved some jobs in Career Explorer first
            </p>
          </div>
        )}
      </div>

      {/* Historical Learning Paths */}
      {historicalPaths.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <Archive className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-700">
                Historical Learning Paths ({historicalPaths.length})
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {renderDeleteButton('all-historical-paths', () => handleDeleteAllPaths(true), 'all historical paths')}
              {showHistorical ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </button>
          
          {showHistorical && (
            <div className="mt-6 space-y-6">
              {historicalPaths.map(path => (
                <div key={path.id} className="bg-white rounded-lg shadow-lg p-6 opacity-90">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="text-lg font-semibold">{path.job_title}</h4>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center">
                          <Archive className="w-3 h-3 mr-1" />
                          Historical
                        </span>
                      </div>
                      <p className="text-gray-600">{path.career_path}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(path.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Progress:</span>
                        <span className="font-medium ml-1">{path.progress}%</span>
                        <span className="text-xs text-gray-500 block">
                          ({path.resources.filter(r => r.completed).length}/{path.resources.length} courses)
                        </span>
                        {path.progress === 100 && (
                          <CheckCircle className="w-5 h-5 text-green-600 inline ml-1" />
                        )}
                      </div>
                      <div className="flex flex-col space-y-1">
                        {renderDeleteButton(`path-${path.id}`, () => handleDeletePath(path.id, true), 'path')}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${path.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {path.skills_to_learn.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-gray-700 flex items-center">
                      Historical Learning Resources
                    </h5>
                    {path.resources.map((resource, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors ${
                          resource.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2 flex-wrap gap-2">
                              <h6 className="font-medium">{resource.title}</h6>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {resource.type}
                              </span>
                              {resource.verified && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                            
                            {resource.completed && resource.completedAt && (
                              <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                                ✅ Completed on {new Date(resource.completedAt).toLocaleDateString()}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center bg-blue-50 px-3 py-1 rounded"
                              >
                                Access Course/Resource
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            </div>
                          </div>
                          <div className="ml-4">
                            {resource.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {path.progress === 100 && (
                    <div className="mt-6 flex items-center justify-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <span className="text-green-600 font-medium">Learning Path Completed! 🎉</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}