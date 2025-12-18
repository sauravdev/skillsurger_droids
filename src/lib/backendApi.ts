// Backend API service for AI Mentor functionality
// Note: VITE_BACKEND_API should include /api/v1 path
// Example: https://api.wisedroids.ai/api/v1 or http://localhost:5002/api/v1
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AIMentorResponse {
  message: string;
  topic?: string;
  userId?: string;
}

export interface InterviewResponse {
  message: string;
}

export interface InterviewFeedback {
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  detailedFeedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    videoStrengths?: string[];
    videoImprovements?: string[];
  };
  videoAnalysis?: {
    bodyLanguageScore: number;
    eyeContactScore: number;
    professionalAppearanceScore: number;
    energyScore: number;
    overallVideoScore: number;
  };
}

export interface CVScore {
  overallScore: number;
  scores: {
    atsOptimization: number;
    contentQuality: number;
    formatting: number;
    keywordRelevance: number;
    impact: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missingElements: string[];
}

export interface CVEnhancement {
  enhancedCV: string;
  parsedData: {
    full_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    current_role?: string;
    years_of_experience?: number;
    summary?: string;
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
    skills?: string[];
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    languages?: string[];
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  changesSummary: string[];
  keyImprovements: {
    atsOptimization: string;
    contentStrength: string;
    formattingChanges: string;
  };
}

class BackendApiService {
  private async makeRequest<T>(
    endpoint: string,
    data: any,
    type: string
  ): Promise<T> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type
        }),
      });

      if (!response.ok) {
        // Try to parse error response for more details
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If parsing fails, use the default error message
        }
        throw new Error(errorMessage);
      }

      const result: BackendResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data;
    } catch (error) {
      // Better error message extraction
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'An unknown error occurred';

      console.error('Backend API error:', errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  async startAIMentorshipSession(topic: string, userId: string): Promise<AIMentorResponse> {
    return this.makeRequest<AIMentorResponse>(
      '/openai/skillsurger',
      { topic, userId },
      'startAIMentorshipSession'
    );
  }

  async sendMessageToAIMentor(
    topic: string,
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AIMentorResponse> {
    return this.makeRequest<AIMentorResponse>(
      '/openai/skillsurger',
      { topic, message, conversationHistory },
      'sendMessageToAIMentor'
    );
  }

  async generateInterviewResponse(
    jobRole: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<InterviewResponse> {
    return this.makeRequest<InterviewResponse>(
      '/openai/skillsurger',
      { jobRole, userMessage, conversationHistory },
      'generateInterviewResponse'
    );
  }

  async endInterview(
    jobRole: string,
    conversationHistory: Array<{ role: string; content: string }>,
    videoFrames?: string[]
  ): Promise<InterviewFeedback> {
    return this.makeRequest<InterviewFeedback>(
      '/openai/skillsurger',
      { jobRole, conversationHistory, videoFrames },
      'endInterview'
    );
  }

  async scoreCVText(cvText: string): Promise<CVScore> {
    return this.makeRequest<CVScore>(
      '/openai/skillsurger',
      { text: cvText },
      'scoreCVText'
    );
  }

  async enhanceCVText(cvText: string, targetRole?: string): Promise<CVEnhancement> {
    return this.makeRequest<CVEnhancement>(
      '/openai/skillsurger',
      { text: cvText, targetRole },
      'enhanceCVText'
    );
  }

  async analyzeCVText(cvText: string): Promise<any> {
    return this.makeRequest<any>(
      '/openai/skillsurger',
      { text: cvText },
      'analyzeCVText'
    );
  }
}

export const backendApi = new BackendApiService();
