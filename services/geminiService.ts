
import { GoogleGenAI, Type } from "@google/genai";
import { LifePhase, TimelineEvent, LifeWisdom } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Distills raw transcript into a coherent first-person narrative.
 * Removes clutter while preserving the soul and original linguistic rhythm of the speech.
 */
export const distillStory = async (transcript: string, theme: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert oral historian. Transform this messy transcript into a cohesive, first-person narrative story.
    Theme: "${theme}"
    Transcript: ${transcript}
    
    Guidelines:
    1. Maintain the speaker's original voice, culture, and linguistic identity.
    2. If the speaker uses multiple languages or code-switches, preserve that rhythm where it adds emotional weight or authenticity.
    3. Remove "uhs", "ums", and filler words.
    4. Structure it into clear, emotional memory units.
    5. The resulting narrative should feel like a single, flowing story as told by the speaker in their natural way of communicating.`,
    config: {
      temperature: 0.4,
    }
  });
  return response.text;
};

/**
 * Higher-level reasoning to decide if a story is "complete" or needs more depth.
 * Language-agnostic analysis of narrative structure.
 */
export const analyzeNarrativeDepth = async (transcript: string, theme: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this life story session regarding the theme "${theme}".
    Current Transcript: "${transcript}"
    
    Decide between three actions:
    1. "ask_clarify": The story is interesting but missing specific details (who, where, feelings). Provide a gentle question in the speaker's dominant language.
    2. "accept": The story is rich and complete enough to extract wisdom.
    3. "abstain": The transcript is too short or doesn't relate to the theme.
    
    Return JSON with "decision" and "message" (the question to ask if decision is ask_clarify).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          decision: { type: Type.STRING, enum: ["ask_clarify", "accept", "abstain"] },
          message: { type: Type.STRING }
        },
        required: ["decision"]
      }
    }
  });
  return JSON.parse(response.text);
};

/**
 * Extracts structured events and abstract wisdom with confidence scores.
 * Operates on semantic meaning across languages.
 */
export const extractLifeStructure = async (transcript: string, context: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this transcript to extract life events and life wisdom.
    Context (Known Timeline): ${context}
    Transcript: ${transcript}
    
    Wisdom should be abstract beliefs verified by experience.
    Events should be specific markers in time.
    
    Process the transcript regardless of the language used. Wisdom and Event descriptions should be in the primary language of the archive (English default, unless the transcript is predominantly another language).
    
    Return JSON with "wisdoms" and "events", each including a "confidence" (0.0 to 1.0).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          wisdoms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                belief: { type: Type.STRING },
                explanation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["belief", "explanation", "confidence"]
            }
          },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event: { type: Type.STRING },
                timeRange: { type: Type.STRING },
                phase: { type: Type.STRING, enum: ["Childhood", "Youth", "Adulthood", "Seniority"] },
                description: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["event", "phase", "confidence"]
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
};
