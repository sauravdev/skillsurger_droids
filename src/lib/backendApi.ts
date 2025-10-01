// Backend API service for AI Mentor functionality
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';

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
      '/skillsurger',
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
      '/skillsurger',
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
      '/skillsurger',
      { jobRole, userMessage, conversationHistory },
      'generateInterviewResponse'
    );
  }

  async endInterview(
    jobRole: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<InterviewFeedback> {
    return this.makeRequest<InterviewFeedback>(
      '/skillsurger',
      { jobRole, conversationHistory },
      'endInterview'
    );
  }
}

export const backendApi = new BackendApiService();
