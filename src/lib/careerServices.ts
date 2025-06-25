import { openai, isOpenAIConfigured } from './openaiConfig';
import { extractJsonFromMarkdown } from './utils';
import { searchGoogleJobs, isGoogleJobsConfigured, type GoogleJobsSearchParams, type GoogleJobResult } from './googleJobsApi';

export interface CareerOption {
  title: string;
  description: string;
  requiredSkills: string[];
  potentialCompanies: string[];
  averageSalary: string;
  growthPotential: string;
}

export interface JobOpportunity {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  type: string;
  salary: string;
  applicationUrl?: string;
  postedDate?: string;
  isRemote?: boolean;
  source?: string;
}

export interface CVSuggestion {
  summary: string;
  highlightedSkills: string[];
  experienceImprovements: Array<{
    original: string;
    improved: string;
  }>;
  additionalSections: Array<{
    title: string;
    content: string;
  }>;
}

// Real companies actively hiring in 2024-2025 by category
const ACTIVE_HIRING_COMPANIES = {
  'technology': {
    'software': ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Spotify', 'Stripe', 'Airbnb', 'Uber', 'Slack', 'Zoom', 'Dropbox', 'Figma', 'Notion', 'Discord', 'Shopify', 'Square', 'Twilio', 'Datadog'],
    'data': ['Netflix', 'Uber', 'Airbnb', 'LinkedIn', 'Spotify', 'Tesla', 'Palantir', 'Snowflake', 'Databricks', 'MongoDB', 'Elastic', 'Splunk', 'Tableau', 'Looker', 'Amplitude'],
    'ai': ['OpenAI', 'Anthropic', 'Hugging Face', 'Scale AI', 'Cohere', 'Stability AI', 'Midjourney', 'Runway', 'Character.AI', 'Perplexity'],
    'cybersecurity': ['CrowdStrike', 'Palo Alto Networks', 'Okta', 'Zscaler', 'SentinelOne', 'Rapid7', 'Qualys', 'Fortinet', 'Check Point', 'Proofpoint'],
    'cloud': ['Amazon Web Services', 'Microsoft Azure', 'Google Cloud', 'Cloudflare', 'DigitalOcean', 'Linode', 'Vultr', 'Oracle Cloud', 'IBM Cloud', 'Alibaba Cloud']
  },
  'finance': {
    'fintech': ['Stripe', 'Square', 'PayPal', 'Coinbase', 'Robinhood', 'Plaid', 'Chime', 'SoFi', 'Affirm', 'Klarna', 'Revolut', 'Wise', 'Brex', 'Ramp'],
    'traditional': ['JPMorgan Chase', 'Goldman Sachs', 'Morgan Stanley', 'Bank of America', 'Wells Fargo', 'Citigroup', 'American Express', 'Capital One', 'Charles Schwab', 'Fidelity'],
    'crypto': ['Coinbase', 'Binance', 'Kraken', 'Gemini', 'FTX', 'Crypto.com', 'BlockFi', 'Circle', 'Chainalysis', 'ConsenSys']
  },
  'healthcare': {
    'healthtech': ['Teladoc', 'Veracyte', 'Moderna', 'BioNTech', 'Illumina', 'Dexcom', 'Guardant Health', 'Exact Sciences', 'Invitae', 'Natera'],
    'pharma': ['Pfizer', 'Johnson & Johnson', 'Roche', 'Novartis', 'Merck', 'AbbVie', 'Bristol Myers Squibb', 'AstraZeneca', 'Gilead Sciences', 'Amgen']
  },
  'retail': {
    'ecommerce': ['Amazon', 'Shopify', 'eBay', 'Etsy', 'Wayfair', 'Chewy', 'Overstock', 'Wish', 'Mercari', 'Poshmark'],
    'traditional': ['Walmart', 'Target', 'Costco', 'Home Depot', 'Lowes', 'Best Buy', 'Macys', 'Nordstrom', 'TJX Companies', 'Ross Stores']
  },
  'media': {
    'streaming': ['Netflix', 'Disney+', 'HBO Max', 'Hulu', 'Amazon Prime Video', 'Apple TV+', 'Paramount+', 'Peacock', 'Discovery+', 'Tubi'],
    'social': ['Meta', 'Twitter', 'TikTok', 'Snapchat', 'Pinterest', 'LinkedIn', 'Reddit', 'Discord', 'Clubhouse', 'BeReal']
  },
  'automotive': {
    'ev': ['Tesla', 'Rivian', 'Lucid Motors', 'NIO', 'XPeng', 'BYD', 'Ford', 'GM', 'Volkswagen', 'BMW'],
    'traditional': ['Toyota', 'Honda', 'Ford', 'General Motors', 'Stellantis', 'Hyundai', 'Nissan', 'Subaru', 'Mazda', 'Mitsubishi']
  }
};

// Current salary ranges by role and experience level (2024-2025 data)
const SALARY_RANGES = {
  'software_engineer': {
    'junior': [70000, 120000],
    'mid': [100000, 160000],
    'senior': [140000, 220000],
    'staff': [180000, 280000]
  },
  'data_scientist': {
    'junior': [75000, 125000],
    'mid': [110000, 170000],
    'senior': [150000, 240000],
    'staff': [200000, 320000]
  },
  'product_manager': {
    'junior': [90000, 140000],
    'mid': [130000, 180000],
    'senior': [170000, 250000],
    'staff': [220000, 350000]
  },
  'designer': {
    'junior': [60000, 100000],
    'mid': [90000, 140000],
    'senior': [130000, 180000],
    'staff': [160000, 220000]
  },
  'marketing_manager': {
    'junior': [50000, 80000],
    'mid': [70000, 110000],
    'senior': [100000, 150000],
    'staff': [130000, 200000]
  },
  'sales_manager': {
    'junior': [55000, 85000],
    'mid': [75000, 120000],
    'senior': [110000, 170000],
    'staff': [150000, 250000]
  }
};

// Location-based salary multipliers
const LOCATION_MULTIPLIERS = {
  'San Francisco': 1.4,
  'New York': 1.3,
  'Seattle': 1.25,
  'Los Angeles': 1.2,
  'Boston': 1.15,
  'Austin': 1.1,
  'Denver': 1.05,
  'Chicago': 1.0,
  'Atlanta': 0.95,
  'Dallas': 0.9,
  'Phoenix': 0.85,
  'Remote': 1.1
};

type SalaryRanges = typeof SALARY_RANGES;
type RoleKey = keyof SalaryRanges;

function getRealisticSalary(role: string, experience: number, location: string): string {
  // Determine experience level
  let level: 'junior' | 'mid' | 'senior' | 'staff' = 'junior';
  if (experience >= 8) level = 'staff';
  else if (experience >= 5) level = 'senior';
  else if (experience >= 2) level = 'mid';

  // Get base salary range
  const roleKey = role.toLowerCase().replace(/\s+/g, '_') as RoleKey;
  const salaryData = SALARY_RANGES[roleKey] || SALARY_RANGES['software_engineer'];
  const [baseMin, baseMax] = salaryData[level];

  // Apply location multiplier
  const locationKey = Object.keys(LOCATION_MULTIPLIERS).find(loc => 
    location.toLowerCase().includes(loc.toLowerCase())
  ) as keyof typeof LOCATION_MULTIPLIERS || 'Chicago';
  const multiplier = LOCATION_MULTIPLIERS[locationKey];

  const adjustedMin = Math.round(baseMin * multiplier);
  const adjustedMax = Math.round(baseMax * multiplier);

  return `$${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()}`;
}

function getCompaniesForRole(role: string, interests: string[]): string[] {
  const roleLower = role.toLowerCase();
  const interestsLower = interests.map(i => i.toLowerCase()).join(' ');

  let companies: string[] = [];

  // Technology roles
  if (roleLower.includes('software') || roleLower.includes('engineer') || roleLower.includes('developer')) {
    if (interestsLower.includes('ai') || interestsLower.includes('machine learning')) {
      companies = ACTIVE_HIRING_COMPANIES.technology.ai;
    } else if (interestsLower.includes('data') || interestsLower.includes('analytics')) {
      companies = ACTIVE_HIRING_COMPANIES.technology.data;
    } else if (interestsLower.includes('security') || interestsLower.includes('cybersecurity')) {
      companies = ACTIVE_HIRING_COMPANIES.technology.cybersecurity;
    } else if (interestsLower.includes('cloud') || interestsLower.includes('aws') || interestsLower.includes('azure')) {
      companies = ACTIVE_HIRING_COMPANIES.technology.cloud;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.technology.software;
    }
  }
  // Finance roles
  else if (roleLower.includes('finance') || roleLower.includes('analyst') || roleLower.includes('banking')) {
    if (interestsLower.includes('fintech') || interestsLower.includes('startup')) {
      companies = ACTIVE_HIRING_COMPANIES.finance.fintech;
    } else if (interestsLower.includes('crypto') || interestsLower.includes('blockchain')) {
      companies = ACTIVE_HIRING_COMPANIES.finance.crypto;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.finance.traditional;
    }
  }
  // Healthcare roles
  else if (roleLower.includes('health') || roleLower.includes('medical') || roleLower.includes('bio')) {
    if (interestsLower.includes('tech') || interestsLower.includes('digital')) {
      companies = ACTIVE_HIRING_COMPANIES.healthcare.healthtech;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.healthcare.pharma;
    }
  }
  // Retail/E-commerce roles
  else if (roleLower.includes('retail') || roleLower.includes('ecommerce') || roleLower.includes('commerce')) {
    if (interestsLower.includes('online') || interestsLower.includes('digital') || interestsLower.includes('ecommerce')) {
      companies = ACTIVE_HIRING_COMPANIES.retail.ecommerce;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.retail.traditional;
    }
  }
  // Media/Social roles
  else if (roleLower.includes('media') || roleLower.includes('content') || roleLower.includes('social')) {
    if (interestsLower.includes('social') || interestsLower.includes('community')) {
      companies = ACTIVE_HIRING_COMPANIES.media.social;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.media.streaming;
    }
  }
  // Automotive roles
  else if (roleLower.includes('automotive') || roleLower.includes('vehicle') || roleLower.includes('transport')) {
    if (interestsLower.includes('electric') || interestsLower.includes('ev') || interestsLower.includes('sustainable')) {
      companies = ACTIVE_HIRING_COMPANIES.automotive.ev;
    } else {
      companies = ACTIVE_HIRING_COMPANIES.automotive.traditional;
    }
  }
  // Default to tech companies
  else {
    companies = ACTIVE_HIRING_COMPANIES.technology.software;
  }

  // Return a random selection of 5-8 companies
  const shuffled = companies.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(8, companies.length));
}

function generateRealisticJobDescription(title: string, company: string, requirements: string[]): string {
  const descriptions = [
    `Join ${company} as a ${title} and help shape the future of technology. We're looking for passionate individuals who want to make a real impact on millions of users worldwide. You'll work with cutting-edge technologies and collaborate with world-class teams.`,
    
    `${company} is seeking a talented ${title} to join our growing team. This role offers the opportunity to work on challenging problems, learn from industry experts, and contribute to products that matter. We offer competitive compensation and excellent growth opportunities.`,
    
    `Exciting opportunity at ${company} for a ${title}! You'll be responsible for driving innovation and delivering high-quality solutions. We're looking for someone who thrives in a fast-paced environment and is passionate about technology and user experience.`,
    
    `${company} is hiring a ${title} to help build the next generation of our platform. You'll work closely with product, design, and engineering teams to create exceptional user experiences. This is a great opportunity for career growth and learning.`,
    
    `We're looking for a ${title} to join ${company}'s mission of transforming the industry. You'll have the chance to work on impactful projects, mentor junior team members, and contribute to technical decisions that shape our product roadmap.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateJobRequirements(title: string, experience: number): string[] {
  const baseTech = ['Strong problem-solving skills', 'Excellent communication abilities', 'Team collaboration experience'];
  const titleLower = title.toLowerCase();
  
  let specific: string[] = [];
  
  if (titleLower.includes('software') || titleLower.includes('engineer') || titleLower.includes('developer')) {
    specific = [
      `${experience}+ years of software development experience`,
      'Proficiency in modern programming languages (Python, JavaScript, Java, or Go)',
      'Experience with cloud platforms (AWS, GCP, or Azure)',
      'Knowledge of software development best practices',
      'Experience with version control systems (Git)',
      'Understanding of agile development methodologies'
    ];
  } else if (titleLower.includes('data')) {
    specific = [
      `${experience}+ years of data analysis experience`,
      'Strong SQL and Python/R programming skills',
      'Experience with data visualization tools (Tableau, Power BI)',
      'Knowledge of statistical analysis and machine learning',
      'Experience with big data technologies',
      'Strong analytical and critical thinking skills'
    ];
  } else if (titleLower.includes('product')) {
    specific = [
      `${experience}+ years of product management experience`,
      'Experience with product analytics and user research',
      'Strong understanding of agile development processes',
      'Excellent stakeholder management skills',
      'Experience with product roadmap planning',
      'Data-driven decision making abilities'
    ];
  } else if (titleLower.includes('design')) {
    specific = [
      `${experience}+ years of design experience`,
      'Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)',
      'Strong portfolio demonstrating design thinking',
      'Experience with user research and usability testing',
      'Understanding of design systems and component libraries',
      'Knowledge of accessibility and inclusive design principles'
    ];
  } else if (titleLower.includes('marketing')) {
    specific = [
      `${experience}+ years of marketing experience`,
      'Experience with digital marketing channels and analytics',
      'Strong understanding of customer acquisition and retention',
      'Proficiency in marketing automation tools',
      'Experience with A/B testing and conversion optimization',
      'Strong content creation and storytelling abilities'
    ];
  } else {
    specific = [
      `${experience}+ years of relevant experience`,
      'Strong analytical and problem-solving skills',
      'Experience with industry-standard tools and technologies',
      'Proven track record of delivering results',
      'Ability to work in fast-paced environments',
      'Strong project management skills'
    ];
  }
  
  return [...specific.slice(0, 4), ...baseTech].slice(0, 6);
}

function getJobApplicationUrl(company: string): string {
  const companyUrls: { [key: string]: string } = {
    'Google': 'https://careers.google.com/',
    'Microsoft': 'https://careers.microsoft.com/',
    'Amazon': 'https://www.amazon.jobs/',
    'Meta': 'https://www.metacareers.com/',
    'Apple': 'https://jobs.apple.com/',
    'Netflix': 'https://jobs.netflix.com/',
    'Spotify': 'https://www.lifeatspotify.com/',
    'Stripe': 'https://stripe.com/jobs',
    'Airbnb': 'https://careers.airbnb.com/',
    'Uber': 'https://www.uber.com/careers/',
    'Tesla': 'https://www.tesla.com/careers',
    'OpenAI': 'https://openai.com/careers',
    'Anthropic': 'https://www.anthropic.com/careers',
    'Coinbase': 'https://www.coinbase.com/careers',
    'Shopify': 'https://www.shopify.com/careers'
  };
  
  return companyUrls[company] || `https://www.google.com/search?q=${encodeURIComponent(company + ' careers')}`;
}

function getRandomPostedDate(): string {
  const daysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Enhanced fallback career options that consider comprehensive profile data
function generateFallbackCareers(
  skills: string[], 
  interests: string[], 
  experience: number,
  profileData?: any
): CareerOption[] {
  const fallbackCareers: CareerOption[] = [];
  
  // Consider current role and desired role from profile
  const currentRole = profileData?.currentRole || '';
  const desiredRole = profileData?.desiredRole || '';
  const location = profileData?.location || {};
  const workPreferences = profileData?.workPreferences || {};
  const salaryExpectations = profileData?.salaryExpectations || {};
  
  console.log('Generating fallback careers with profile data:', {
    currentRole,
    desiredRole,
    location,
    workPreferences,
    salaryExpectations,
    experience
  });

  // Tech-related careers
  if (skills.some(skill => /javascript|python|java|react|node|programming|software|web|development|typescript|angular|vue/i.test(skill)) ||
      interests.some(interest => /technology|programming|software|web|development|coding|tech/i.test(interest)) ||
      /developer|engineer|programmer|software/i.test(currentRole) ||
      /developer|engineer|programmer|software/i.test(desiredRole)) {
    
    const baseSalary = salaryExpectations.min || (experience < 3 ? 60000 : experience < 7 ? 80000 : 120000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 90000 : experience < 7 ? 120000 : 180000);
    
    fallbackCareers.push({
      title: experience < 3 ? 'Junior Software Developer' : experience < 7 ? 'Software Developer' : 'Senior Software Developer',
      description: `Design, develop, and maintain software applications using modern programming languages and frameworks. ${workPreferences.remotePreference === 'remote_only' ? 'Remote-friendly position available.' : ''}`,
      requiredSkills: ['Programming', 'Problem Solving', 'Version Control', 'Testing', ...skills.filter(s => /javascript|python|react|node/i.test(s)).slice(0, 3)],
      potentialCompanies: getCompaniesForRole('Software Developer', interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'Excellent - High demand with continuous learning opportunities and career advancement'
    });
  }

  // Data-related careers
  if (skills.some(skill => /data|analytics|sql|python|statistics|machine learning|ai|tableau|power bi/i.test(skill)) ||
      interests.some(interest => /data|analytics|statistics|machine learning|ai|business intelligence/i.test(interest)) ||
      /data|analyst|scientist/i.test(currentRole) ||
      /data|analyst|scientist/i.test(desiredRole)) {
    
    const baseSalary = salaryExpectations.min || (experience < 3 ? 65000 : experience < 7 ? 90000 : 140000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 95000 : experience < 7 ? 140000 : 200000);
    
    fallbackCareers.push({
      title: experience < 3 ? 'Data Analyst' : experience < 7 ? 'Data Scientist' : 'Senior Data Scientist',
      description: `Analyze complex data sets to extract insights and support business decision-making. Work with stakeholders to identify opportunities for leveraging company data.`,
      requiredSkills: ['SQL', 'Python/R', 'Statistics', 'Data Visualization', ...skills.filter(s => /sql|python|tableau/i.test(s)).slice(0, 2)],
      potentialCompanies: getCompaniesForRole('Data Scientist', interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'Very High - Growing field with increasing demand across all industries'
    });
  }

  // Marketing/Business careers
  if (skills.some(skill => /marketing|business|sales|communication|strategy|seo|social media|content/i.test(skill)) ||
      interests.some(interest => /marketing|business|sales|strategy|entrepreneurship|digital marketing/i.test(interest)) ||
      /marketing|business|sales|manager/i.test(currentRole) ||
      /marketing|business|sales|manager/i.test(desiredRole)) {
    
    const baseSalary = salaryExpectations.min || (experience < 3 ? 45000 : experience < 7 ? 65000 : 95000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 65000 : experience < 7 ? 95000 : 140000);
    
    fallbackCareers.push({
      title: experience < 3 ? 'Marketing Coordinator' : experience < 7 ? 'Marketing Manager' : 'Senior Marketing Manager',
      description: `Develop and execute marketing strategies to promote products and services. Manage campaigns across digital and traditional channels.`,
      requiredSkills: ['Digital Marketing', 'Analytics', 'Communication', 'Strategy', ...skills.filter(s => /marketing|seo|social/i.test(s)).slice(0, 2)],
      potentialCompanies: getCompaniesForRole('Marketing Manager', interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'Good - Evolving with digital transformation and increasing demand for digital expertise'
    });
  }

  // Design careers
  if (skills.some(skill => /design|ui|ux|creative|photoshop|figma|adobe|sketch|wireframe/i.test(skill)) ||
      interests.some(interest => /design|creative|art|user experience|visual|graphics/i.test(interest)) ||
      /design|creative|ui|ux/i.test(currentRole) ||
      /design|creative|ui|ux/i.test(desiredRole)) {
    
    const baseSalary = salaryExpectations.min || (experience < 3 ? 55000 : experience < 7 ? 80000 : 120000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 80000 : experience < 7 ? 120000 : 160000);
    
    fallbackCareers.push({
      title: experience < 3 ? 'UI/UX Designer' : experience < 7 ? 'Senior UX Designer' : 'Lead UX Designer',
      description: `Create intuitive and engaging user experiences for digital products. Conduct user research and design user-centered solutions.`,
      requiredSkills: ['Design Tools', 'User Research', 'Prototyping', 'Visual Design', ...skills.filter(s => /figma|adobe|sketch/i.test(s)).slice(0, 2)],
      potentialCompanies: getCompaniesForRole('UX Designer', interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'High - Essential for digital product development and user experience optimization'
    });
  }

  // Product Management careers
  if (skills.some(skill => /product|management|agile|scrum|leadership|coordination|jira|asana/i.test(skill)) ||
      interests.some(interest => /management|leadership|organization|coordination|product/i.test(interest)) ||
      /product|manager|lead|coordinator/i.test(currentRole) ||
      /product|manager|lead|coordinator/i.test(desiredRole)) {
    
    const baseSalary = salaryExpectations.min || (experience < 3 ? 50000 : experience < 7 ? 75000 : 110000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 75000 : experience < 7 ? 110000 : 150000);
    
    fallbackCareers.push({
      title: experience < 3 ? 'Product Coordinator' : experience < 7 ? 'Product Manager' : 'Senior Product Manager',
      description: `Plan, execute, and oversee product development to ensure successful completion within scope, timeline, and budget constraints.`,
      requiredSkills: ['Product Management', 'Communication', 'Leadership', 'Risk Management', ...skills.filter(s => /agile|scrum|jira/i.test(s)).slice(0, 2)],
      potentialCompanies: getCompaniesForRole('Product Manager', interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'Stable - Always in demand across industries with opportunities for specialization'
    });
  }

  // If we have a desired role, try to create a career path towards it
  if (desiredRole && !fallbackCareers.some(career => career.title.toLowerCase().includes(desiredRole.toLowerCase()))) {
    const baseSalary = salaryExpectations.min || 60000;
    const maxSalary = salaryExpectations.max || 100000;
    
    fallbackCareers.push({
      title: desiredRole,
      description: `Career path towards your desired role of ${desiredRole}. Leverage your current experience and skills to transition into this position.`,
      requiredSkills: [...skills.slice(0, 4), 'Professional Development', 'Industry Knowledge'],
      potentialCompanies: getCompaniesForRole(desiredRole, interests),
      averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
      growthPotential: 'Aligned with your career goals and interests'
    });
  }

  // If no specific matches, provide general career options based on experience level
  if (fallbackCareers.length === 0) {
    const baseSalary = salaryExpectations.min || (experience < 3 ? 50000 : experience < 7 ? 70000 : 100000);
    const maxSalary = salaryExpectations.max || (experience < 3 ? 75000 : experience < 7 ? 105000 : 140000);
    
    fallbackCareers.push(
      {
        title: experience < 3 ? 'Business Analyst' : experience < 7 ? 'Senior Business Analyst' : 'Principal Business Analyst',
        description: `Analyze business processes and requirements to improve efficiency and drive growth. Bridge the gap between business needs and technical solutions.`,
        requiredSkills: ['Analysis', 'Communication', 'Problem Solving', 'Documentation', ...skills.slice(0, 2)],
        potentialCompanies: ['Deloitte', 'Accenture', 'PwC', 'EY', 'KPMG', 'IBM', 'Capgemini'],
        averageSalary: `$${baseSalary.toLocaleString()} - $${maxSalary.toLocaleString()}`,
        growthPotential: 'Good - Essential for business optimization and digital transformation'
      },
      {
        title: experience < 3 ? 'Operations Specialist' : experience < 7 ? 'Operations Manager' : 'Director of Operations',
        description: `Oversee daily operations and implement processes to improve organizational efficiency and productivity.`,
        requiredSkills: ['Process Improvement', 'Leadership', 'Analytics', 'Communication', ...skills.slice(0, 2)],
        potentialCompanies: ['Amazon', 'FedEx', 'UPS', 'Walmart', 'Target', 'Tesla', 'Apple'],
        averageSalary: `$${(baseSalary * 0.9).toFixed(0)} - $${maxSalary.toLocaleString()}`,
        growthPotential: 'Stable - Core business function with opportunities for advancement'
      }
    );
  }

  return fallbackCareers.slice(0, 5); // Return up to 5 options
}

// Enhanced realistic job database with current 2024-2025 companies and positions
function generateRealisticJobs(jobSearchContext: any): JobOpportunity[] {
  const { careerTitle, profile, location, workPreferences, salaryExpectations, interests = [] } = jobSearchContext;
  
  // Determine job category from career title
  let jobCategory = 'software'; // default
  const titleLower = careerTitle.toLowerCase();
  
  if (titleLower.includes('data') || titleLower.includes('analyst') || titleLower.includes('scientist')) {
    jobCategory = 'data';
  } else if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) {
    jobCategory = 'design';
  } else if (titleLower.includes('marketing') || titleLower.includes('growth') || titleLower.includes('seo')) {
    jobCategory = 'marketing';
  } else if (titleLower.includes('product') || titleLower.includes('manager')) {
    jobCategory = 'product';
  }

  // Determine experience level
  const experience = profile.yearsOfExperience || 0;
  
  // Get relevant companies
  const companies = getCompaniesForRole(careerTitle, interests);

  // Determine location preferences
  const preferredLocation = location.preferences?.length > 0 
    ? location.preferences[0] 
    : location.current?.city && location.current?.state 
      ? `${location.current.city}, ${location.current.state}`
      : 'San Francisco, CA';

  // Generate realistic job opportunities
  const jobs: JobOpportunity[] = [];
  
  // Create 5-8 realistic jobs
  for (let i = 0; i < Math.min(8, companies.length); i++) {
    const company = companies[i];
    
    // Generate job titles based on experience and role
    const baseTitles = [careerTitle];
    if (experience < 2) {
      baseTitles.push(`Junior ${careerTitle}`, `Associate ${careerTitle}`);
    } else if (experience >= 5) {
      baseTitles.push(`Senior ${careerTitle}`, `Lead ${careerTitle}`);
    }
    
    const jobTitle = baseTitles[Math.floor(Math.random() * baseTitles.length)];
    
    // Determine work type and location
    let jobLocation = preferredLocation;
    let workType = 'Full-time';
    let isRemote = false;
    
    if (workPreferences.remotePreference === 'remote_only') {
      jobLocation = 'Remote';
      isRemote = true;
    } else if (workPreferences.remotePreference === 'hybrid') {
      jobLocation = `${preferredLocation} (Hybrid)`;
      isRemote = false;
    }

    if (workPreferences.type) {
      workType = workPreferences.type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('-');
    }

    // Generate realistic salary
    const salary = getRealisticSalary(careerTitle, experience, jobLocation);
    
    // Generate requirements
    const requirements = generateJobRequirements(jobTitle, Math.max(1, experience));
    
    // Generate description
    const description = generateRealisticJobDescription(jobTitle, company, requirements);
    
    // Get application URL
    const applicationUrl = getJobApplicationUrl(company);
    
    // Get posted date
    const postedDate = getRandomPostedDate();

    jobs.push({
      title: jobTitle,
      company: company,
      location: jobLocation,
      description: description,
      requirements: requirements,
      type: workType,
      salary: salary,
      applicationUrl: applicationUrl,
      postedDate: postedDate,
      isRemote: isRemote
    });
  }

  return jobs;
}

export async function generateCareerOptions(
  skills: string[],
  interests: string[],
  experience: number,
  profileData?: any
): Promise<CareerOption[]> {
  console.log('Generating career options with comprehensive data:', { 
    skills, 
    interests, 
    experience, 
    profileData 
  });

  // Always provide fallback options first
  const fallbackOptions = generateFallbackCareers(skills, interests, experience, profileData);

  if (!isOpenAIConfigured()) {
    console.log('OpenAI not configured, returning enhanced fallback options');
    return fallbackOptions;
  }

  try {
    console.log('Attempting to use OpenAI for enhanced career generation...');
    
    // Create comprehensive context for AI
    const contextData = {
      skills,
      interests,
      experience,
      currentRole: profileData?.currentRole || '',
      desiredRole: profileData?.desiredRole || '',
      location: profileData?.location || {},
      workPreferences: profileData?.workPreferences || {},
      salaryExpectations: profileData?.salaryExpectations || {},
      education: profileData?.education || [],
      languages: profileData?.languages || [],
      summary: profileData?.summary || ''
    };
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert career counselor with access to comprehensive profile data. Generate 3-5 highly personalized career options.
          
          Consider ALL provided information including:
          - Current skills and interests
          - Years of experience and current role
          - Desired career direction
          - Location and work preferences (remote, hybrid, etc.)
          - Salary expectations
          - Educational background
          - Languages spoken
          - Professional summary
          
          Respond with ONLY a JSON array of career objects. Each object must have:
          - title (string) - specific to experience level
          - description (string, 2-3 sentences) - personalized based on profile
          - requiredSkills (array of 4-6 strings) - mix of existing and growth skills
          - potentialCompanies (array of 5-7 relevant company names)
          - averageSalary (string with realistic range based on location and experience)
          - growthPotential (string describing realistic growth outlook)
          
          Make recommendations that:
          1. Build on existing experience and skills
          2. Align with stated career goals and interests
          3. Consider location and work preferences
          4. Respect salary expectations
          5. Provide realistic progression paths`
        },
        {
          role: "user",
          content: `Generate personalized career options for this profile:
          
          Skills: ${skills.join(', ') || 'General skills'}
          Interests: ${interests.join(', ') || 'Various interests'}
          Experience: ${experience} years
          Current Role: ${contextData.currentRole || 'Not specified'}
          Desired Role: ${contextData.desiredRole || 'Open to opportunities'}
          Location: ${[contextData.location.city, contextData.location.state, contextData.location.country].filter(Boolean).join(', ') || 'Flexible'}
          Work Preference: ${contextData.workPreferences.remotePreference || 'No preference'}
          Salary Range: ${contextData.salaryExpectations.min && contextData.salaryExpectations.max 
            ? `$${contextData.salaryExpectations.min.toLocaleString()} - $${contextData.salaryExpectations.max.toLocaleString()}`
            : 'Market rate'}
          Education: ${contextData.education.map(edu => `${edu.degree} from ${edu.institution}`).join(', ') || 'Not specified'}
          Languages: ${contextData.languages.join(', ') || 'Not specified'}
          Summary: ${contextData.summary || 'Not provided'}
          
          Generate realistic, personalized career paths that align with this comprehensive profile.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    if (!response.choices[0]?.message?.content) {
      console.log('No response from OpenAI, using enhanced fallback');
      return fallbackOptions;
    }

    try {
      const content = response.choices[0].message.content.trim();
      console.log('OpenAI response:', content);
      
      // Extract JSON from markdown if needed
      const cleanedContent = extractJsonFromMarkdown(content);
      
      // Try to parse as JSON array directly
      let parsed = JSON.parse(cleanedContent);
      
      // If it's wrapped in an object, extract the array
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (parsed.careers) parsed = parsed.careers;
        else if (parsed.careerOptions) parsed = parsed.careerOptions;
        else if (parsed.options) parsed = parsed.options;
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each career option
        const validCareers = parsed.filter(career => 
          career.title && 
          career.description && 
          Array.isArray(career.requiredSkills) &&
          Array.isArray(career.potentialCompanies) &&
          career.averageSalary &&
          career.growthPotential
        );
        
        if (validCareers.length > 0) {
          console.log('Successfully parsed AI careers:', validCareers.length);
          return validCareers;
        }
      }
      
      console.log('Invalid AI response format, using enhanced fallback');
      return fallbackOptions;
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Using enhanced fallback options due to parse error');
      return fallbackOptions;
    }
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    console.log('Using enhanced fallback options due to API error');
    return fallbackOptions;
  }
}

export async function findJobOpportunities(
  jobSearchContext: any
): Promise<JobOpportunity[]> {
  console.log('Finding job opportunities with context:', jobSearchContext);

  if (isGoogleJobsConfigured()) {
    try {
      const searchParams: GoogleJobsSearchParams = {
        query: jobSearchContext.jobTitle,
        location: jobSearchContext.location?.city || '',
        remoteOnly: jobSearchContext.workPreferences?.remotePreference === 'remote_only',
      };

      const googleJobs = await searchGoogleJobs(searchParams);

      if (googleJobs.length > 0) {
        console.log(`Found ${googleJobs.length} jobs from Google Jobs API`);
        return googleJobs.map(job => ({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          type: 'Full-time', // Defaulting type
          salary: job.salary || 'Not specified',
          applicationUrl: job.applicationUrl,
          postedDate: job.postedDate,
          isRemote: job.isRemote,
          source: job.source,
        }));
      }
    } catch (error) {
      console.error('Error fetching from Google Jobs API, using fallback:', error);
    }
  }

  // Fallback to existing job generation if Google Jobs API fails or is not configured
  console.log('Using AI-powered job generation as fallback');
  return generateRealisticJobs(jobSearchContext);
}

export async function generateCVSuggestions(
  comprehensiveCVData: string,
  targetJob: JobOpportunity
): Promise<CVSuggestion> {
  console.log('Generating CV suggestions with comprehensive data for job:', targetJob.title);
  
  // Parse the comprehensive CV data
  let cvData;
  try {
    cvData = JSON.parse(comprehensiveCVData);
  } catch {
    cvData = { summary: comprehensiveCVData };
  }
  
  const fallbackSuggestion: CVSuggestion = {
    summary: `Results-driven ${cvData.professional?.currentRole || 'professional'} with ${cvData.professional?.yearsOfExperience || 'several'} years of experience seeking to leverage expertise in ${targetJob.title} role. Proven track record of delivering high-quality results and contributing to team success. ${cvData.preferences?.remotePreference === 'remote_only' ? 'Experienced in remote work environments.' : ''}`,
    highlightedSkills: [
      ...targetJob.requirements.slice(0, 3),
      ...(cvData.skills || []).slice(0, 3)
    ].slice(0, 6),
    experienceImprovements: cvData.experience?.length > 0 ? [
      {
        original: cvData.experience[0]?.description || "Worked on various projects and tasks",
        improved: `Led ${targetJob.title.toLowerCase()} initiatives resulting in measurable business impact and improved team efficiency. Collaborated with cross-functional teams to deliver high-quality solutions.`
      }
    ] : [],
    additionalSections: [
      {
        title: "Key Achievements",
        content: `Highlight specific accomplishments relevant to ${targetJob.title} role, including quantifiable results and impact metrics.`
      },
      {
        title: "Technical Proficiencies",
        content: `Emphasize technical skills that align with ${targetJob.company}'s technology stack and requirements.`
      }
    ]
  };

  if (!isOpenAIConfigured()) {
    return fallbackSuggestion;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert CV optimization specialist. Analyze comprehensive profile data and provide specific, actionable CV improvements for a target job.

          Respond with ONLY a JSON object:
          {
            "summary": "optimized professional summary (2-3 sentences)",
            "highlightedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
            "experienceImprovements": [
              {
                "original": "original experience description",
                "improved": "enhanced version with impact and metrics"
              }
            ],
            "additionalSections": [
              {
                "title": "section name",
                "content": "specific suggested content"
              }
            ]
          }
          
          Focus on:
          - Matching keywords from job requirements
          - Quantifying achievements where possible
          - Highlighting relevant experience and skills
          - Addressing any gaps with transferable skills
          - Optimizing for ATS systems
          - Tailoring language to company culture`
        },
        {
          role: "user",
          content: `Optimize CV for this job opportunity:
          
          Job: ${targetJob.title} at ${targetJob.company}
          Location: ${targetJob.location}
          Requirements: ${targetJob.requirements.join(', ')}
          Description: ${targetJob.description}
          
          Current Profile Data:
          Personal: ${JSON.stringify(cvData.personalInfo || {})}
          Professional: ${JSON.stringify(cvData.professional || {})}
          Experience: ${JSON.stringify(cvData.experience || [])}
          Education: ${JSON.stringify(cvData.education || [])}
          Skills: ${JSON.stringify(cvData.skills || [])}
          Languages: ${JSON.stringify(cvData.languages || [])}
          Interests: ${JSON.stringify(cvData.interests || [])}
          Work Preferences: ${JSON.stringify(cvData.preferences || {})}
          
          Provide specific, actionable CV optimization suggestions that will make this candidate stand out for this specific role.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    if (!response.choices[0]?.message?.content) {
      return fallbackSuggestion;
    }

    try {
      const content = response.choices[0].message.content.trim();
      
      // Extract JSON from markdown if needed
      const cleanedContent = extractJsonFromMarkdown(content);
      
      const parsed = JSON.parse(cleanedContent);
      
      return {
        summary: parsed.summary || fallbackSuggestion.summary,
        highlightedSkills: Array.isArray(parsed.highlightedSkills) ? parsed.highlightedSkills : fallbackSuggestion.highlightedSkills,
        experienceImprovements: Array.isArray(parsed.experienceImprovements) ? parsed.experienceImprovements : fallbackSuggestion.experienceImprovements,
        additionalSections: Array.isArray(parsed.additionalSections) ? parsed.additionalSections : fallbackSuggestion.additionalSections
      };
    } catch (parseError) {
      console.error('Error parsing CV suggestions:', parseError);
      return fallbackSuggestion;
    }
  } catch (error: any) {
    console.error('Error generating CV suggestions:', error);
    return fallbackSuggestion;
  }
}