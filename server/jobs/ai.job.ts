import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import axios from "axios";
import { Job } from "../queues/queue";

export interface AIJobPayload {
  provider: "gemini" | "openai" | "ollama" | string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
}

export interface AIJobResult {
  text: string;
}

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined on the server environment. Please define it in Settings.");
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined. Please define it in Settings.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

export async function handleAIJob(job: Job<AIJobPayload, AIJobResult>): Promise<AIJobResult> {
  const { provider, model, prompt, systemInstruction } = job.data;
  console.log(`[AI Job] Initiating background AI completion using provider '${provider}'`);

  if (provider === "gemini") {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents: prompt,
      config: { systemInstruction }
    });
    const text = response.text || "";
    return { text };
  }

  if (provider === "openai") {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction || "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });
    const text = response.choices[0].message.content || "";
    return { text };
  }

  if (provider === "ollama") {
    try {
      const response = await axios.post("http://localhost:11434/api/generate", {
        model: model || "llama3",
        prompt: prompt,
        stream: false
      });
      const text = response.data.response || "";
      return { text };
    } catch (err: any) {
      throw new Error(`Ollama service was not reachable on localhost:11434: ${err.message}`);
    }
  }

  throw new Error(`Unsupported engine provider driver: '${provider}'`);
}
