import { GoogleGenAI, Type } from "@google/genai";
import { QuoteData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchZenWisdom = async (): Promise<QuoteData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, profound, and calming quote about the art of doing nothing, silence, or stillness. It should be philosophical.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The quote text itself."
            },
            author: {
              type: Type.STRING,
              description: "The author of the quote or 'Unknown' / 'Zen Proverb'"
            }
          },
          required: ["text", "author"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText) as QuoteData;
    return data;

  } catch (error) {
    console.error("Failed to fetch wisdom:", error);
    return {
      text: "Silence is the language of God, all else is poor translation.",
      author: "Rumi"
    };
  }
};
