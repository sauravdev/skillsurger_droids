import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findJobOpportunities } from '../lib/careerServices';
import type { JobOpportunity } from '../lib/careerServices';
import { Briefcase, MapPin, Building, Clock, CircleDollarSign, Link as LinkIcon, AlertTriangle, Loader2 } from 'lucide-react';

const JobSearchPage = () => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const jobTitle = searchParams.get('title');
    const jobLocation = searchParams.get('location');

    if (jobTitle) {
      fetchJobs(jobTitle, jobLocation);
    } else {
      setLoading(false);
      setError("No job title provided for the search.");
    }
  }, [location.search]);

  const fetchJobs = async (title: string, loc: string | null) => {
    setLoading(true);
    setError(null);
    try {
      // We need to create a context object that matches what findJobOpportunities expects.
      // Since we only have title and location from the URL, we'll create a minimal context.
      const jobSearchContext = {
        jobTitle: title,
        location: { city: loc || '' },
        workPreferences: { remotePreference: 'no_preference' },
        // Add other properties with default values if needed by the function
        profile: { yearsOfExperience: 0 },
        countryCode: 'us' // Default to US, could be enhanced to detect from user profile
      };
      const opportunities = await findJobOpportunities(jobSearchContext);
      setJobs(opportunities);
    } catch (err) {
      setError('Failed to fetch job opportunities.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Job Search Results</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-10 px-4 sm:px-6 lg:px-8 bg-red-50 border-l-4 border-red-400">
          <div className="flex justify-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <p className="mt-3 text-lg text-red-700">{error}</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-6">
          {jobs.map((job, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-blue-600">{job.title}</h2>
                  <div className="flex items-center text-gray-600 mt-2">
                    <Building className="h-5 w-5 mr-2" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{job.location}</span>
                  </div>
                </div>
                {job.applicationUrl && (
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Apply
                      <LinkIcon className="ml-2 -mr-1 h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-700">{job.description}</p>
                {job.requirements && job.requirements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800">Requirements:</h4>
                    <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                      {job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                   {job.type && <div className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" /> {job.type}</div>}
                   {job.salary && <div className="flex items-center"><CircleDollarSign className="h-4 w-4 mr-1.5" /> {job.salary}</div>}
                   {job.postedDate && <div className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {job.postedDate}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No jobs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default JobSearchPage; 