import axios from 'axios';

export interface AIResponse {
  text: string;
  error?: string;
}

export const aiService = {
  async complete(params: {
    provider: 'gemini' | 'openai' | 'ollama';
    model?: string;
    prompt: string;
    systemInstruction?: string;
  }): Promise<AIResponse> {
    try {
      const response = await axios.post('/api/ai/complete', params);
      return response.data;
    } catch (error: any) {
      return { text: '', error: error.response?.data?.error || error.message };
    }
  }
};
