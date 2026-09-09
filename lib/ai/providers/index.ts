import { AIProvider } from "../types";
import { GeminiAIProvider } from "./gemini";
import { OpenAIAIProvider } from "./openai";
import { LocalAIProvider } from "./local";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const gemini = new GeminiAIProvider();
  if (gemini.isAvailable()) {
    cachedProvider = gemini;
    return cachedProvider;
  }

  const openai = new OpenAIAIProvider();
  if (openai.isAvailable()) {
    cachedProvider = openai;
    return cachedProvider;
  }

  cachedProvider = new LocalAIProvider();
  return cachedProvider;
}

export { LocalAIProvider, GeminiAIProvider, OpenAIAIProvider };
