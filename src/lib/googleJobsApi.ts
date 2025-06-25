// Google Jobs Search API integration
export interface GoogleJobResult {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  applicationUrl: string;
  postedDate: string;
  isRemote: boolean;
  source: string;
}

export interface GoogleJobsSearchParams {
  query: string;
  location?: string;
  datePosted?: 'today' | 'week' | 'month';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: 'entry' | 'mid' | 'senior';
}

// Google Custom Search API configuration
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

export function isGoogleJobsConfigured(): boolean {
  return !!(GOOGLE_API_KEY && GOOGLE_SEARCH_ENGINE_ID && 
           GOOGLE_API_KEY !== 'your_google_api_key' && 
           GOOGLE_SEARCH_ENGINE_ID !== 'your_search_engine_id');
}

export async function searchGoogleJobs(params: GoogleJobsSearchParams): Promise<GoogleJobResult[]> {
  if (!isGoogleJobsConfigured()) {
    console.warn('Google Jobs API not configured. Using fallback job generation.');
    return generateFallbackGoogleJobs(params);
  }

  try {
    // Build search query
    let searchQuery = `${params.query} jobs`;
    
    if (params.location && !params.remoteOnly) {
      searchQuery += ` in ${params.location}`;
    }
    
    if (params.remoteOnly) {
      searchQuery += ' remote';
    }
    
    if (params.jobType) {
      searchQuery += ` ${params.jobType.replace('-', ' ')}`;
    }
    
    if (params.experienceLevel) {
      searchQuery += ` ${params.experienceLevel} level`;
    }

    // Add site-specific searches for better results
    const jobSites = [
      'site:linkedin.com/jobs',
      'site:indeed.com',
      'site:glassdoor.com',
      'site:monster.com',
      'site:ziprecruiter.com',
      'site:simplyhired.com'
    ];

    const results: GoogleJobResult[] = [];

    // Search multiple job sites
    for (const site of jobSites.slice(0, 3)) { // Limit to 3 sites to avoid rate limits
      try {
        const siteQuery = `${searchQuery} ${site}`;
        const searchResults = await performGoogleSearch(siteQuery, params);
        results.push(...searchResults);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Error searching ${site}:`, error);
        continue;
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = removeDuplicateJobs(results);
    return uniqueResults.slice(0, 10); // Return top 10 results

  } catch (error) {
    console.error('Error searching Google Jobs:', error);
    return [];
  }
}

async function performGoogleSearch(query: string, params: GoogleJobsSearchParams): Promise<GoogleJobResult[]> {
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', GOOGLE_API_KEY!);
  searchUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID!);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('num', '10');
  
  // Add date filter
  if (params.datePosted) {
    const dateMap = {
      'today': 'd1',
      'week': 'w1',
      'month': 'm1'
    };
    searchUrl.searchParams.set('dateRestrict', dateMap[params.datePosted]);
  }

  const response = await fetch(searchUrl.toString());
  
  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.items) {
    return [];
  }

  return data.items.map((item: any) => parseGoogleSearchResult(item, params));
}

function parseGoogleSearchResult(item: any, params: GoogleJobsSearchParams): GoogleJobResult {
  const title = extractJobTitle(item.title);
  const company = extractCompany(item.title, item.snippet);
  const location = extractLocation(item.snippet, params.location);
  const description = cleanDescription(item.snippet);
  const requirements = extractRequirements(item.snippet);
  const salary = extractSalary(item.snippet);
  const postedDate = extractPostedDate(item.snippet);
  const isRemote = checkIfRemote(item.title, item.snippet);
  
  return {
    title,
    company,
    location: location || params.location || 'Location not specified',
    description,
    requirements,
    salary,
    applicationUrl: item.link,
    postedDate,
    isRemote,
    source: extractSource(item.link)
  };
}

function extractJobTitle(title: string): string {
  // Remove common job site suffixes
  const cleanTitle = title
    .replace(/\s*-\s*(LinkedIn|Indeed|Glassdoor|Monster|ZipRecruiter|SimplyHired).*$/i, '')
    .replace(/\s*\|\s*.*$/i, '')
    .replace(/\s*at\s+.*$/i, '')
    .trim();
  
  return cleanTitle || 'Job Opportunity';
}

function extractCompany(title: string, snippet: string): string {
  // Try to extract company from title (usually after "at")
  const titleMatch = title.match(/\bat\s+([^-|]+)/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Try to extract from snippet
  const snippetMatch = snippet.match(/(?:Company|Employer|Organization):\s*([^.]+)/i);
  if (snippetMatch) {
    return snippetMatch[1].trim();
  }
  
  // Look for common company patterns
  const companyPatterns = [
    /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Systems|Solutions))/,
    /([A-Z][a-zA-Z\s&]{2,20})\s+is\s+(?:hiring|looking|seeking)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Company not specified';
}

function extractLocation(snippet: string, defaultLocation?: string): string {
  // Look for location patterns
  const locationPatterns = [
    /(?:Location|Based in|Located in):\s*([^.]+)/i,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /(Remote|Work from home|Telecommute)/i,
    /([A-Z][a-zA-Z\s]+,\s*(?:USA|United States|US))/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return defaultLocation || 'Location not specified';
}

function cleanDescription(snippet: string): string {
  // Clean up the snippet to make it more readable
  return snippet
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?()-]/g, '')
    .trim()
    .substring(0, 300) + (snippet.length > 300 ? '...' : '');
}

function extractRequirements(snippet: string): string[] {
  const requirements: string[] = [];
  
  // Look for common requirement patterns
  const requirementPatterns = [
    /(?:Requirements?|Qualifications?|Skills?):\s*([^.]+)/i,
    /(?:Must have|Required|Need):\s*([^.]+)/i,
    /(\d+\+?\s*years?\s+(?:of\s+)?experience)/i,
    /(Bachelor'?s?\s+degree)/i,
    /(Master'?s?\s+degree)/i,
    /(?:Experience with|Knowledge of|Proficiency in)\s+([^.]+)/i
  ];
  
  for (const pattern of requirementPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      requirements.push(match[1].trim());
    }
  }
  
  // Add some default requirements if none found
  if (requirements.length === 0) {
    requirements.push(
      'Relevant experience in the field',
      'Strong communication skills',
      'Team collaboration abilities'
    );
  }
  
  return requirements.slice(0, 5); // Limit to 5 requirements
}

function extractSalary(snippet: string): string | undefined {
  // Look for salary patterns
  const salaryPatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|\/year)/i,
    /(\d{1,3}(?:,\d{3})*)\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})*)\s*(?:USD|dollars)/i
  ];
  
  for (const pattern of salaryPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      if (match[2]) {
        return `$${match[1]} - $${match[2]}`;
      } else {
        return `$${match[1]}`;
      }
    }
  }
  
  return undefined;
}

function extractPostedDate(snippet: string): string {
  // Look for date patterns
  const datePatterns = [
    /(?:Posted|Published|Listed)\s+(\d{1,2})\s+days?\s+ago/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    const match = snippet.match(pattern);
    if (match) {
      if (match[0].includes('days ago')) {
        const daysAgo = parseInt(match[1]);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
      } else {
        return match[1];
      }
    }
  }
  
  // Default to recent date
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // 0-7 days ago
  return date.toISOString().split('T')[0];
}

function checkIfRemote(title: string, snippet: string): boolean {
  const remoteKeywords = /remote|work from home|telecommute|distributed|anywhere/i;
  return remoteKeywords.test(title) || remoteKeywords.test(snippet);
}

function extractSource(url: string): string {
  try {
    const domain = new URL(url).hostname;
    if (domain.includes('linkedin.com')) return 'LinkedIn';
    if (domain.includes('indeed.com')) return 'Indeed';
    if (domain.includes('glassdoor.com')) return 'Glassdoor';
    if (domain.includes('monster.com')) return 'Monster';
    if (domain.includes('ziprecruiter.com')) return 'ZipRecruiter';
    if (domain.includes('simplyhired.com')) return 'SimplyHired';
    return domain;
  } catch {
    return 'Unknown';
  }
}

function removeDuplicateJobs(jobs: GoogleJobResult[]): GoogleJobResult[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Fallback function for when Google Jobs API is not available
export function generateFallbackGoogleJobs(params: GoogleJobsSearchParams): GoogleJobResult[] {
  console.log('Using fallback job generation for Google Jobs API', params);
  
  // This would use the existing realistic job generation logic
  // but formatted to match GoogleJobResult interface
  return [
    {
      title: `Software Engineer, ${params.query}`,
      company: 'Tech Solutions Inc.',
      location: params.location || 'Remote',
      description: 'Seeking a skilled software engineer to build and maintain scalable software solutions. Experience with React and Node.js preferred.',
      requirements: ['3+ years of experience in software development', 'Proficiency in JavaScript', 'Experience with cloud platforms (AWS, GCP, Azure)'],
      salary: '$120,000 - $160,000',
      applicationUrl: 'https://www.linkedin.com/jobs/',
      postedDate: new Date().toISOString().split('T')[0],
      isRemote: params.remoteOnly || (params.location || '').toLowerCase() === 'remote',
      source: 'LinkedIn (Fallback)'
    },
    {
      title: `Product Manager, ${params.query}`,
      company: 'Innovate Co.',
      location: params.location || 'New York, NY',
      description: 'Join our team to lead the development of innovative products. Strong technical background and communication skills required.',
      requirements: ['5+ years of product management experience', 'Experience with Agile methodologies', 'Strong analytical skills'],
      salary: '$140,000 - $180,000',
      applicationUrl: 'https://www.indeed.com/jobs',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
      isRemote: params.remoteOnly || false,
      source: 'Indeed (Fallback)'
    }
  ];
}