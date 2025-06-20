import { openai, isOpenAIConfigured } from './openaiConfig';
import { generateCareerOptions, findJobOpportunities, generateCVSuggestions } from './careerServices';
import { extractJsonFromMarkdown } from './utils';
import { generateVerifiedLearningResources, type VerifiedResource } from './enhancedLearningResources';

export async function generateCareerSuggestions(skills: string[], interests: string[]) {
  try {
    if (!isOpenAIConfigured()) {
      return 'AI-powered career suggestions are currently disabled. Please configure your OpenAI API key to enable this feature.';
    }

    const careerOptions = await generateCareerOptions(skills, interests, 0);
    const formattedSuggestions = careerOptions.map(option => `
Career Path: ${option.title}

${option.description}

Required Skills:
${option.requiredSkills.map(skill => `- ${skill}`).join('\n')}

Potential Companies:
${option.potentialCompanies.map(company => `- ${company}`).join('\n')}

Average Salary: ${option.averageSalary}
Growth Potential: ${option.growthPotential}
`).join('\n---\n');

    return formattedSuggestions || 'No suggestions generated.';
  } catch (error: any) {
    console.error('Error generating career suggestions:', error);
    return 'Unable to generate career suggestions at this time. Please try again later.';
  }
}

export async function generateLearningPlan(
  jobTitle: string,
  jobDescription: string = '',
  requirements: string[] = []
): Promise<Array<{
  type: string;
  title: string;
  description: string;
  url: string;
  completed: boolean;
  verified: boolean;
  fallbackUrl?: string;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}>> {
  try {
    console.log('Generating learning plan for:', jobTitle);

    // Use the enhanced verified learning resources
    const verifiedResources = await generateVerifiedLearningResources(jobTitle, jobDescription, requirements);
    
    // Convert VerifiedResource to the expected format
    const learningPlan = verifiedResources.map(resource => ({
      type: resource.type,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      completed: false,
      verified: resource.verified,
      fallbackUrl: resource.fallbackUrl,
      price: resource.price,
      rating: resource.rating,
      provider: resource.provider,
      difficulty: resource.difficulty,
      duration: resource.duration
    }));

    console.log('Generated verified learning plan with', learningPlan.length, 'resources');
    return learningPlan;

  } catch (error: any) {
    console.error('Error generating learning plan:', error);
    
    // Return curated fallback resources
    return generateFallbackLearningPlan(jobTitle, requirements);
  }
}

function generateFallbackLearningPlan(jobTitle: string, requirements: string[]): Array<{
  type: string;
  title: string;
  description: string;
  url: string;
  completed: boolean;
  verified: boolean;
  price?: string;
  rating?: number;
  provider?: string;
  difficulty?: string;
  duration?: string;
}> {
  const jobTitleLower = jobTitle.toLowerCase();
  const skillsLower = requirements.map(req => req.toLowerCase()).join(' ');
  
  // Curated 2024-2025 learning resources based on job type
  if (jobTitleLower.includes('software') || jobTitleLower.includes('developer') || jobTitleLower.includes('programming')) {
    return [
      {
        type: 'Course',
        title: 'freeCodeCamp Full Stack Development',
        description: 'Comprehensive free curriculum covering HTML, CSS, JavaScript, React, Node.js, and databases. Earn certifications while building projects.',
        url: 'https://www.freecodecamp.org/learn/',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.8,
        provider: 'freeCodeCamp',
        difficulty: 'Beginner to Advanced',
        duration: '300+ hours'
      },
      {
        type: 'Course',
        title: 'JavaScript Algorithms and Data Structures',
        description: 'Learn JavaScript fundamentals and computer science concepts through interactive coding challenges.',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.8,
        provider: 'freeCodeCamp',
        difficulty: 'Beginner',
        duration: '300 hours'
      },
      {
        type: 'Tutorial',
        title: 'JavaScript Tutorial for Beginners',
        description: 'Complete JavaScript programming tutorial covering all fundamentals with practical examples.',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '3 hours'
      },
      {
        type: 'Course',
        title: 'React Tutorial and Projects Course',
        description: 'Learn React fundamentals and build real-world projects including e-commerce sites and social media apps.',
        url: 'https://www.youtube.com/watch?v=ly3m6mv5qvg',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.7,
        provider: 'YouTube',
        difficulty: 'Intermediate',
        duration: '12 hours'
      },
      {
        type: 'Practice',
        title: 'LeetCode Programming Practice',
        description: 'Solve coding challenges and prepare for technical interviews. Practice algorithms and data structures.',
        url: 'https://leetcode.com/problemset/all/',
        completed: false,
        verified: true,
        price: 'Freemium',
        rating: 4.5,
        provider: 'LeetCode',
        difficulty: 'Intermediate',
        duration: 'Self-paced'
      },
      {
        type: 'Documentation',
        title: 'MDN Web Development Guide',
        description: 'Comprehensive web development documentation covering HTML, CSS, JavaScript, and web APIs.',
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.9,
        provider: 'Mozilla',
        difficulty: 'All Levels',
        duration: 'Self-paced'
      },
      {
        type: 'Course',
        title: 'Git and GitHub Tutorial',
        description: 'Learn version control with Git and collaboration with GitHub. Essential skills for any developer.',
        url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '1 hour'
      },
      {
        type: 'Project',
        title: 'Build 15 JavaScript Projects',
        description: 'Create portfolio-worthy projects including weather apps, calculators, and games using vanilla JavaScript.',
        url: 'https://www.youtube.com/watch?v=3PHXvlpOkf4',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.5,
        provider: 'YouTube',
        difficulty: 'Intermediate',
        duration: '8 hours'
      }
    ];
  }
  
  if (jobTitleLower.includes('data') || jobTitleLower.includes('analytics') || jobTitleLower.includes('scientist')) {
    return [
      {
        type: 'Course',
        title: 'Data Analysis with Python',
        description: 'Learn data analysis using Python, pandas, NumPy, and matplotlib through hands-on projects.',
        url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.8,
        provider: 'freeCodeCamp',
        difficulty: 'Intermediate',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'Machine Learning with Python',
        description: 'Learn machine learning algorithms and implementation using Python and scikit-learn.',
        url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.7,
        provider: 'freeCodeCamp',
        difficulty: 'Advanced',
        duration: '300 hours'
      },
      {
        type: 'Course',
        title: 'SQL Tutorial - Full Database Course',
        description: 'Complete SQL tutorial covering database design, queries, joins, and advanced concepts.',
        url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '4 hours'
      },
      {
        type: 'Practice',
        title: 'Kaggle Learn Courses',
        description: 'Free micro-courses on Python, machine learning, data visualization, and SQL with hands-on exercises.',
        url: 'https://www.kaggle.com/learn',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'Kaggle',
        difficulty: 'All Levels',
        duration: 'Self-paced'
      },
      {
        type: 'Tutorial',
        title: 'Python Data Science Tutorial',
        description: 'Complete data science tutorial using Python, pandas, and matplotlib for data analysis.',
        url: 'https://www.youtube.com/watch?v=vmEHCJofslg',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.5,
        provider: 'YouTube',
        difficulty: 'Intermediate',
        duration: '6 hours'
      },
      {
        type: 'Course',
        title: 'Statistics and Probability Course',
        description: 'Learn essential statistics and probability concepts for data science and analytics.',
        url: 'https://www.khanacademy.org/math/statistics-probability',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.7,
        provider: 'Khan Academy',
        difficulty: 'Intermediate',
        duration: 'Self-paced'
      },
      {
        type: 'Practice',
        title: 'SQL Practice on W3Schools',
        description: 'Interactive SQL exercises and examples to practice database queries and operations.',
        url: 'https://www.w3schools.com/sql/sql_exercises.asp',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.3,
        provider: 'W3Schools',
        difficulty: 'Beginner',
        duration: 'Self-paced'
      },
      {
        type: 'Project',
        title: 'Data Science Projects with Python',
        description: 'Build complete data science projects from data collection to visualization and insights.',
        url: 'https://www.youtube.com/watch?v=MpF9HENQjDo',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.4,
        provider: 'YouTube',
        difficulty: 'Advanced',
        duration: '10 hours'
      }
    ];
  }
  
  if (jobTitleLower.includes('design') || jobTitleLower.includes('ui') || jobTitleLower.includes('ux')) {
    return [
      {
        type: 'Course',
        title: 'Google UX Design Professional Certificate',
        description: 'Industry-recognized UX design certification covering the complete design process from research to prototyping.',
        url: 'https://www.coursera.org/professional-certificates/google-ux-design',
        completed: false,
        verified: true,
        price: 'Paid',
        rating: 4.8,
        provider: 'Coursera',
        difficulty: 'Beginner',
        duration: '6 months'
      },
      {
        type: 'Tutorial',
        title: 'Figma UI Design Tutorial - Complete Course',
        description: 'Comprehensive Figma tutorial covering interface design, prototyping, and design systems.',
        url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.7,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '4 hours'
      },
      {
        type: 'Course',
        title: 'UI/UX Design Specialization',
        description: 'Complete UX design process including user research, wireframing, prototyping, and testing.',
        url: 'https://www.coursera.org/specializations/ui-ux-design',
        completed: false,
        verified: true,
        price: 'Freemium',
        rating: 4.6,
        provider: 'Coursera',
        difficulty: 'Intermediate',
        duration: '4 months'
      },
      {
        type: 'Practice',
        title: 'Daily UI Design Challenge',
        description: 'Practice UI design with daily challenges. Build a portfolio of 100 UI designs across different categories.',
        url: 'https://www.dailyui.co/',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.5,
        provider: 'Daily UI',
        difficulty: 'All Levels',
        duration: 'Self-paced'
      },
      {
        type: 'Tutorial',
        title: 'Adobe XD Tutorial for Beginners',
        description: 'Learn Adobe XD for UI/UX design including wireframing, prototyping, and collaboration.',
        url: 'https://www.youtube.com/watch?v=68w2VwalD5w',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.4,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '2 hours'
      },
      {
        type: 'Course',
        title: 'Design Thinking and Innovation',
        description: 'Learn design thinking methodology for solving complex problems and creating user-centered solutions.',
        url: 'https://www.coursera.org/learn/uva-darden-design-thinking-innovation',
        completed: false,
        verified: true,
        price: 'Freemium',
        rating: 4.5,
        provider: 'Coursera',
        difficulty: 'Intermediate',
        duration: '4 weeks'
      },
      {
        type: 'Tutorial',
        title: 'Color Theory for Designers',
        description: 'Master color theory principles for creating effective and appealing design palettes.',
        url: 'https://www.youtube.com/watch?v=Qj1FK8n7WgY',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '1 hour'
      },
      {
        type: 'Project',
        title: 'Design System Creation Workshop',
        description: 'Learn to create comprehensive design systems with reusable components and style guides.',
        url: 'https://www.youtube.com/watch?v=wc5krSHtFFs',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.5,
        provider: 'YouTube',
        difficulty: 'Advanced',
        duration: '3 hours'
      }
    ];
  }
  
  if (jobTitleLower.includes('marketing') || jobTitleLower.includes('digital') || jobTitleLower.includes('social')) {
    return [
      {
        type: 'Certification',
        title: 'Google Digital Marketing & E-commerce Certificate',
        description: 'Comprehensive digital marketing certification covering SEO, SEM, social media, email marketing, and analytics.',
        url: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce',
        completed: false,
        verified: true,
        price: 'Paid',
        rating: 4.7,
        provider: 'Coursera',
        difficulty: 'Beginner',
        duration: '6 months'
      },
      {
        type: 'Course',
        title: 'HubSpot Content Marketing Course',
        description: 'Free comprehensive course on content marketing strategy, creation, and distribution.',
        url: 'https://academy.hubspot.com/courses/content-marketing',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'HubSpot Academy',
        difficulty: 'Beginner',
        duration: '4 hours'
      },
      {
        type: 'Course',
        title: 'Facebook Social Media Marketing Professional Certificate',
        description: 'Learn social media marketing strategies, content creation, advertising, and analytics across major platforms.',
        url: 'https://www.coursera.org/professional-certificates/facebook-social-media-marketing',
        completed: false,
        verified: true,
        price: 'Paid',
        rating: 4.5,
        provider: 'Coursera',
        difficulty: 'Beginner',
        duration: '7 months'
      },
      {
        type: 'Course',
        title: 'Google Analytics 4 Complete Course',
        description: 'Master Google Analytics 4 for tracking, measuring, and optimizing digital marketing campaigns.',
        url: 'https://www.youtube.com/watch?v=gBeMELnxdIg',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.4,
        provider: 'YouTube',
        difficulty: 'Intermediate',
        duration: '3 hours'
      },
      {
        type: 'Course',
        title: 'SEO Training Course',
        description: 'Learn search engine optimization including keyword research, on-page SEO, link building, and technical SEO.',
        url: 'https://www.youtube.com/watch?v=xsVTqzratPs',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.5,
        provider: 'YouTube',
        difficulty: 'Intermediate',
        duration: '5 hours'
      },
      {
        type: 'Tutorial',
        title: 'Email Marketing Masterclass',
        description: 'Complete guide to email marketing including list building, automation, and campaign optimization.',
        url: 'https://www.youtube.com/watch?v=8rMGD3pOEks',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.3,
        provider: 'YouTube',
        difficulty: 'Beginner',
        duration: '2 hours'
      },
      {
        type: 'Practice',
        title: 'Google Ads Certification',
        description: 'Official Google Ads certification covering search, display, video, shopping, and app advertising.',
        url: 'https://skillshop.exceedlms.com/student/catalog/list?category_ids=53-google-ads-certifications',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.6,
        provider: 'Google Skillshop',
        difficulty: 'Intermediate',
        duration: 'Self-paced'
      },
      {
        type: 'Project',
        title: 'Build a Complete Marketing Campaign',
        description: 'Create end-to-end marketing campaigns including strategy, content creation, execution, and performance analysis.',
        url: 'https://www.youtube.com/watch?v=nU-IIXBWlS4',
        completed: false,
        verified: true,
        price: 'Free',
        rating: 4.4,
        provider: 'YouTube',
        difficulty: 'Advanced',
        duration: '6 hours'
      }
    ];
  }
  
  // Generic fallback for other roles
  return [
    {
      type: 'Course',
      title: 'Professional Skills Development',
      description: 'Develop essential workplace skills including communication, leadership, project management, and problem-solving.',
      url: 'https://www.coursera.org/courses?query=professional%20development',
      completed: false,
      verified: true,
      price: 'Freemium',
      rating: 4.4,
      provider: 'Coursera',
      difficulty: 'All Levels',
      duration: 'Varies'
    },
    {
      type: 'Tutorial',
      title: 'Industry-Specific Skills on YouTube',
      description: 'Access free tutorials and training videos specific to your industry and role requirements.',
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(jobTitle + ' tutorial 2024'),
      completed: false,
      verified: true,
      price: 'Free',
      rating: 4.3,
      provider: 'YouTube',
      difficulty: 'Varies',
      duration: 'Varies'
    },
    {
      type: 'Certification',
      title: 'LinkedIn Learning Career Path',
      description: 'Follow structured learning paths designed for your specific career goals with industry-recognized certifications.',
      url: 'https://www.linkedin.com/learning/',
      completed: false,
      verified: true,
      price: 'Paid',
      rating: 4.3,
      provider: 'LinkedIn Learning',
      difficulty: 'All Levels',
      duration: 'Varies'
    },
    {
      type: 'Practice',
      title: 'Skill Assessment and Practice',
      description: 'Test and improve your skills with interactive assessments and hands-on practice exercises.',
      url: 'https://www.pluralsight.com/product/skill-assessments',
      completed: false,
      verified: true,
      price: 'Freemium',
      rating: 4.2,
      provider: 'Pluralsight',
      difficulty: 'All Levels',
      duration: 'Self-paced'
    },
    {
      type: 'Project',
      title: 'Portfolio Development Project',
      description: 'Build a professional portfolio showcasing your skills and experience relevant to your target role.',
      url: 'https://www.freecodecamp.org/news/how-to-build-a-developer-portfolio-website/',
      completed: false,
      verified: true,
      price: 'Free',
      rating: 4.5,
      provider: 'freeCodeCamp',
      difficulty: 'Intermediate',
      duration: '10 hours'
    },
    {
      type: 'Course',
      title: 'Time Management and Productivity',
      description: 'Learn effective time management techniques, productivity systems, and work-life balance strategies.',
      url: 'https://www.coursera.org/learn/work-smarter-not-harder',
      completed: false,
      verified: true,
      price: 'Freemium',
      rating: 4.4,
      provider: 'Coursera',
      difficulty: 'Beginner',
      duration: '4 weeks'
    }
  ];
}