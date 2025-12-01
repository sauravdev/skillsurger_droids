// Backend API service for AI Mentor functionality
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002';

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
  changesSummary: string[];
  keyImprovements: {
    atsOptimization: string;
    contentStrength: string;
    formattingChanges: string;
  };
}

class BackendApiService {
  private async makeRequest<T>(
    _endpoint: string,
    data: any,
    type: string
  ): Promise<T> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/v1/openai/skillsurger`, {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BackendResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  async startAIMentorshipSession(topic: string, userId: string): Promise<AIMentorResponse> {
    return this.makeRequest<AIMentorResponse>(
      '/api/v1/openai/skillsurger',
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
      '/api/v1/openai/skillsurger',
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
      '/api/v1/openai/skillsurger',
      { jobRole, userMessage, conversationHistory },
      'generateInterviewResponse'
    );
  }

  async endInterview(
    jobRole: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<InterviewFeedback> {
    return this.makeRequest<InterviewFeedback>(
      '/api/v1/openai/skillsurger',
      { jobRole, conversationHistory },
      'endInterview'
    );
  }

  async scoreCVText(cvText: string): Promise<CVScore> {
    return this.makeRequest<CVScore>(
      '/api/v1/openai/skillsurger',
      { text: cvText },
      'scoreCVText'
    );
  }

  async enhanceCVText(cvText: string, targetRole?: string): Promise<CVEnhancement> {
    return this.makeRequest<CVEnhancement>(
      '/api/v1/openai/skillsurger',
      { text: cvText, targetRole },
      'enhanceCVText'
    );
  }
}

export const backendApi = new BackendApiService();
