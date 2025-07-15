import { openai, isOpenAIConfigured } from './openaiConfig';
import { supabase } from './supabase';
import { extractJsonFromMarkdown } from './utils';

export interface MentorshipSession {
  id: string;
  mentee_id: string;
  mentor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
}

export interface MockInterview {
  id: string;
  user_id: string;
  job_role: string;
  scheduled_at: string;
  feedback: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  conversation?: Array<{
    role: 'user' | 'interviewer';
    content: string;
  }>;
  technical_score?: number;
  communication_score?: number;
  overall_score?: number;
  detailed_feedback?: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface MentorProfile {
  id: string;
  user_id: string;
  specialization: string;
  experience_years: number;
  hourly_rate: number;
  availability: Array<{
    day: string;
    times: string[];
  }>;
}

export interface AIMentorshipSession {
  id: string;
  user_id: string;
  topic: string;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function startAIMentorshipSession(topic: string): Promise<AIMentorshipSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ai_mentorship_sessions')
      .insert([{
        user_id: user.id,
        topic,
        conversation: []
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      topic: data.topic,
      conversation: data.conversation || []
    };
  } catch (error) {
    console.error('Error starting AI mentorship session:', error);
    return null;
  }
}

export async function sendMessageToAIMentor(
  sessionId: string,
  message: string
): Promise<string> {
  try {
    if (!isOpenAIConfigured()) {
      return 'AI mentorship is currently disabled. Please configure your OpenAI API key to enable this feature.';
    }

    const { data: session, error: sessionError } = await supabase
      .from('ai_mentorship_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('Session not found');

    const currentConversation = session.conversation || [];

    const conversationHistory = [
      {
        role: "system",
        content: `You are an expert mentor in ${session.topic}, providing guidance and advice to help professionals develop their careers.
        Be supportive, constructive, and provide actionable advice based on industry best practices.`
      },
      ...currentConversation.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: conversationHistory,
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content || 'No response generated';

    const updatedConversation = [
      ...currentConversation,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ];

    const { error: updateError } = await supabase
      .from('ai_mentorship_sessions')
      .update({ conversation: updatedConversation })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return aiResponse;
  } catch (error: any) {
    console.error('Error sending message to AI mentor:', error);
    throw new Error(error.message || 'Failed to process message');
  }
}

export async function scheduleMockInterview(jobRole: string, scheduledAt: string): Promise<MockInterview | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mock_interviews')
      .insert([{
        user_id: user.id,
        job_role: jobRole,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        conversation: []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling mock interview:', error);
    return null;
  }
}

export async function generateInterviewResponse(
  jobRole: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    if (!isOpenAIConfigured()) {
      return 'AI interviewer is currently disabled. Please configure your OpenAI API key to enable this feature.';
    }

    const [title, company] = jobRole.split(' at ');

    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are conducting a technical interview for a ${title} position at ${company}.
          
          Make it a difficult interview technically, HR wise and managerially as well.
          
          Your role:
          - Act as a professional technical interviewer
          - Ask relevant technical questions based on the role
          - Follow-up on candidate's responses
          - Evaluate technical knowledge, problem-solving, and communication
          - Keep responses concise and focused
          - Maintain a professional and constructive tone
          
          Focus areas:
          - Technical skills required for ${title}
          - Problem-solving methodology
          - Past experience and projects
          - System design and architecture (if applicable)
          - Best practices and industry standards`
        },
        ...formattedHistory,
        { role: "user", content: userMessage }
      ],
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'Could you please elaborate on that?';
  } catch (error) {
    console.error('Error generating interview response:', error);
    throw new Error('Failed to generate interview response');
  }
}

export async function endInterview(interviewId: string): Promise<{
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  detailedFeedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error('AI interviewer is currently disabled');
    }

    // Get the interview with conversation
    const { data: interview, error: getError } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (getError) throw getError;
    if (!interview) throw new Error('Interview not found');
    if (!interview.conversation || !Array.isArray(interview.conversation)) {
      throw new Error('No interview conversation found');
    }

    // Format conversation for analysis in a more structured way
    const formattedConversation = interview.conversation
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Generate feedback using GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer providing detailed feedback for a ${interview.job_role} position.
          
          Analyze the following interview conversation and provide structured feedback.
          
          Your response MUST be a valid JSON object with this exact structure:
          {
            "feedback": "detailed feedback text",
            "technical_score": 1-5,
            "communication_score": 1-5,
            "overall_score": 1-5,
            "detailed_feedback": {
              "strengths": ["strength 1", "strength 2"],
              "improvements": ["improvement 1", "improvement 2"],
              "recommendations": ["recommendation 1", "recommendation 2"]
            }
          }

          Rules:
          1. Ensure all scores are integers between 1 and 5
          2. Include at least 2 items in each array
          3. Keep feedback concise but specific
          4. Focus on actionable insights
          5. Base feedback on both technical knowledge and communication skills
          6. IMPORTANT: Return ONLY the JSON object, no other text or explanation`
        },
        ...formattedConversation.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error('Failed to generate feedback');
    }

    let feedbackData;
    try {
      const content = response.choices[0].message.content.trim();
      
      // Extract JSON from markdown if needed
      const cleanedContent = extractJsonFromMarkdown(content);
      
      feedbackData = JSON.parse(cleanedContent);
      
      // Validate the feedback data structure
      if (!feedbackData.feedback || 
          !Number.isInteger(feedbackData.technical_score) ||
          !Number.isInteger(feedbackData.communication_score) ||
          !Number.isInteger(feedbackData.overall_score) ||
          !feedbackData.detailed_feedback?.strengths?.length ||
          !feedbackData.detailed_feedback?.improvements?.length ||
          !feedbackData.detailed_feedback?.recommendations?.length) {
        throw new Error('Invalid feedback format received from AI');
      }

      // Ensure scores are within valid range
      const scores = [
        feedbackData.technical_score,
        feedbackData.communication_score,
        feedbackData.overall_score
      ];

      if (!scores.every(score => score >= 1 && score <= 5)) {
        throw new Error('Invalid score range received from AI');
      }
    } catch (parseError) {
      console.error('Error parsing feedback:', parseError);
      throw new Error('Failed to parse interview feedback');
    }

    // Update interview with feedback
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        status: 'completed',
        feedback: feedbackData.feedback,
        technical_score: feedbackData.technical_score,
        communication_score: feedbackData.communication_score,
        overall_score: feedbackData.overall_score,
        detailed_feedback: feedbackData.detailed_feedback
      })
      .eq('id', interviewId);

    if (updateError) throw updateError;

    return {
      feedback: feedbackData.feedback,
      technicalScore: feedbackData.technical_score,
      communicationScore: feedbackData.communication_score,
      overallScore: feedbackData.overall_score,
      detailedFeedback: feedbackData.detailed_feedback
    };
  } catch (error: any) {
    console.error('Error ending interview:', error);
    throw error;
  }
}

export async function getMentors(): Promise<MentorProfile[]> {
  try {
    const { data, error } = await supabase
      .from('mentor_profiles')
      .select(`
        *,
        profiles (
          full_name,
          linkedin_url
        )
      `);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return [];
  }
}

export async function scheduleMentorshipSession(
  mentorId: string,
  scheduledAt: string,
  durationMinutes: number = 60
): Promise<MentorshipSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert([{
        mentee_id: user.id,
        mentor_id: mentorId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling mentorship session:', error);
    return null;
  }
}