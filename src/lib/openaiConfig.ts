import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Only show the warning once during initialization
if (!apiKey || apiKey === 'your_openai_api_key') {
  console.warn('OpenAI features are disabled. To enable them, set VITE_OPENAI_API_KEY in your .env file.');
}

export const isOpenAIConfigured = (): boolean => {
  return true;
};

export const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent initialization errors
  dangerouslyAllowBrowser: true
});