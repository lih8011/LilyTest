import { GoogleGenAI, Type } from "@google/genai";
import { VocabPair } from "../types";

const systemInstruction = `
You are an expert language tutor specializing in Traditional Chinese (Taiwan usage) and English.
Your task is to generate vocabulary pairs for a typing game.
1. The English translation should be standard, concise, and suitable for typing practice (1-2 words max).
2. The Chinese should be standard Traditional Chinese (Taiwan). 
3. Avoid synonyms that are ambiguous. The mapping should be as direct as possible (e.g., "Apple" -> "蘋果").
4. Ensure the English is all lowercase unless it's a proper noun.
`;

const MOCK_DATA: VocabPair[] = [
  { id: '1', chinese: "你好", english: "hello", errorCount: 0 },
  { id: '2', chinese: "世界", english: "world", errorCount: 0 },
  { id: '3', chinese: "電腦", english: "computer", errorCount: 0 },
  { id: '4', chinese: "貓", english: "cat", errorCount: 0 },
  { id: '5', chinese: "狗", english: "dog", errorCount: 0 },
  { id: '6', chinese: "書", english: "book", errorCount: 0 },
  { id: '7', chinese: "水", english: "water", errorCount: 0 },
  { id: '8', chinese: "火", english: "fire", errorCount: 0 },
  { id: '9', chinese: "樹", english: "tree", errorCount: 0 },
  { id: '10', chinese: "車", english: "car", errorCount: 0 },
];

export const generateVocabulary = async (topicContext: string): Promise<VocabPair[]> => {
  try {
    // Safety check for process.env to avoid crashes in browser if polyfill missing
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;

    if (!apiKey) {
      console.warn("API Key not found, using mock data.");
      // Return mock data immediately without throwing
      return Promise.resolve(MOCK_DATA);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Requesting 10 items, which will result in 20 questions total
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 10 distinct vocabulary pairs related to: ${topicContext}. Ensure the Chinese is Traditional Chinese.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chinese: { type: Type.STRING, description: "The Traditional Chinese word or phrase" },
              english: { type: Type.STRING, description: "The English translation" },
              partOfSpeech: { type: Type.STRING, description: "noun, verb, adj, etc." }
            },
            required: ["chinese", "english"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");

    const rawData = JSON.parse(jsonText);

    // Transform into VocabPair with IDs and error tracking
    return rawData.map((item: any) => ({
      id: crypto.randomUUID(),
      chinese: item.chinese,
      english: item.english.toLowerCase().trim(),
      partOfSpeech: item.partOfSpeech,
      errorCount: 0
    }));

  } catch (error) {
    console.error("Gemini API Error (Falling back to mock):", error);
    return MOCK_DATA;
  }
};