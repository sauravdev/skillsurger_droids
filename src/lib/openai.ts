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

  if (learningPlan.length === 0) {
    console.warn(`No learning resources could be generated for "${jobTitle}". The generated plan will be empty.`);
  } else {
    console.log('Generated verified learning plan with', learningPlan.length, 'resources');
  }
  
  return learningPlan;
}

/**
 * Generates suggestions for improving a CV based on a job description.
 * @param cvText The text content of the user's CV.
 */
export async function generateCVSuggestionsForJob(cvText: string, jobDescription: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    return 'CV suggestions are currently disabled. Please configure your OpenAI API key.';
  }
}

/*
 * Generates suggestions for improving a CV based on a job description.
 * @param cvText The text content of the user's CV.
 * @param jobDescription The description of the target job.
 * @returns A string containing CV improvement suggestions.
export async function generateCVSuggestions(cvText: string, jobDescription: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    return 'CV suggestions are currently disabled. Please configure your OpenAI API key.';
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert career coach. Analyze the provided CV and job description, then provide specific, actionable suggestions for improvement. Focus on tailoring the CV to the job. Provide a concise list of 3-5 key recommendations. Use markdown for formatting.`
      },
      {
        role: "user",
        content: `CV:\n${cvText}\n\nJob Description:\n${jobDescription}`
      }
    ],
    temperature: 0.6,
    max_tokens: 800
  });

  return response.choices[0]?.message?.content || 'No suggestions generated.';
}
*/

/**
 * Given a job title, use OpenAI to generate 3-4 synonyms or related job titles.
 * Returns an array of strings. Falls back to the original if OpenAI is not configured or fails.
 */
export async function getJobTitleSynonymsWithOpenAI(jobTitle: string): Promise<string[]> {
  if (!isOpenAIConfigured()) {
    return [jobTitle];
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in job market analysis. Given a job title, provide 3-4 synonyms or closely related job titles that a candidate should also search for. Respond with only a JSON array of strings.'
        },
        {
          role: 'user',
          content: `Job Title: ${jobTitle}`
        }
      ],
      temperature: 0.4,
      max_tokens: 100
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [jobTitle];
    // Try to parse as JSON array
    let parsed: string[] = [];
    try {
      parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(s => s.trim()).filter(Boolean);
      }
    } catch {
      // fallback: try to extract array from markdown
      try {
        const cleaned = extractJsonFromMarkdown(content);
        parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => s.trim()).filter(Boolean);
        }
      } catch {}
    }
    return [jobTitle];
  } catch (e) {
    return [jobTitle];
  }
  return [jobTitle];
}