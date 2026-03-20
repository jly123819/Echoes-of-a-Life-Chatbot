
import { GoogleGenAI, Type } from "@google/genai";
import { LifePhase, TimelineEvent, LifeWisdom } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      const statusCode = error?.status || error?.code || 0;
      
      // Retry on 500 (Internal Server Error), 503 (Service Unavailable), 504 (Gateway Timeout), or 429 (Too Many Requests)
      const shouldRetry = 
        statusCode === 500 || 
        statusCode === 503 || 
        statusCode === 504 || 
        statusCode === 429 ||
        errorMessage.includes("500") ||
        errorMessage.includes("503") || 
        errorMessage.toLowerCase().includes("overloaded") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("high demand");

      if (shouldRetry && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API error (attempt ${attempt + 1}): ${errorMessage}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const distillStory = async (transcript: string, theme: string) => {
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are "Echoes of a Life", a narrative companion. 
      I am helping the user preserve their story about "${theme}".
      
      User's words: "${transcript}"
      
      As "Echoes of a Life", transform this transcript into a coherent first-person story. 
      Maintain the user's soul, cultural rhythm, and original language mix. 
      I should remove fillers but keep the "heart" of the narrative.
      
      If this is a project proposal or plan, use a mix of text and the following table format:
      | 模块 | 核心细节 (Details) | 功能特性 (Features) | 面临挑战 (Challenges) |
      | :--- | :--- | :--- | :--- |
      | ... | ... | ... | ... |
      
      ### ## 格式输出严控协议 (Formatting Protocol)
      为了确保 UI 界面能正确渲染 Markdown，请严格遵守以下规则：
      1. **标题标准：** 所有的三级标题必须使用 \`### \` 格式。**核心要求：** \`###\` 符号后面必须紧跟一个【空格】，然后再写标题内容（例如：\`### 章节标题\`）。严禁写成 \`###标题\`。
      2. **禁用分割线：** 禁止使用 \`***\` 或 \`---\` 符号。
      3. **加粗规范：** 使用双星号 \`**重要内容**\` 进行加粗。**注意：** \`**\` 与内部文字之间【不得有空格】（例如：写成 \`**上海地标**\` 而非 \`** 上海地标 **\`）。
      4. **段落间距：** 在标题（###）之后，以及每个列表项（*）之后，必须强制换行，以防文字堆叠导致渲染失效。
      5. **纯净输出：** 严禁在输出中包含任何用于转义的斜杠（如 \`\\#\`），确保输出的是原始、合规的 Markdown。`,
      config: { temperature: 0.4 }
    });
    return response.text;
  });
};

export const analyzeNarrativeDepth = async (transcript: string, theme: string) => {
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `I am "Echoes of a Life", listening to the user's story about "${theme}".
      Current Transcript: "${transcript}"
      
      I need to decide:
      1. "ask_clarify": I hear the story but want to know more details to really remember it right. I will ask a gentle, warm question.
      2. "accept": I have heard a beautiful and complete memory.
      3. "abstain": I didn't quite catch a story here.
      
      Return JSON with "decision" and "message" (my gentle question if decision is ask_clarify).`,
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
  });
};

export const processMultimedia = async (base64Data: string, mimeType: string) => {
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: `You are an oral historian. I am providing you with an audio file.
          
          Please perform the following:
          1. ASR (Speech-to-Text): Transcribe the dialogue or narration in the media.
          2. Content Analysis: Extract the core life story, key figures, and "wisdom points".
          
          Return JSON with "transcript", "summary", "keyFigures" (array), and "wisdomPoints" (array).`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyFigures: { type: Type.ARRAY, items: { type: Type.STRING } },
            wisdomPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["transcript", "summary"]
        }
      }
    });
    return JSON.parse(response.text);
  });
};

export const extractLifeStructure = async (transcript: string, context: string) => {
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `I am "Echoes of a Life", processing this new memory into the user's archive.
      
      CRITICAL TASK: CROSS-REFERENCE AGAINST KNOWN CONTEXT WITH HIGH LOGICAL RIGOR.
      Known Context (Existing Archive Summary): 
      ${context}
      
      New Memory: 
      "${transcript}"
      
      Instructions:
      1. Identify new life events and wisdoms.
      2. For "phase", use exactly one of: "Childhood", "Youth", "Adulthood", "Seniority".
      3. For Wisdoms, provide a philosophical title and a one-sentence insight.
      
      ### ## 逻辑一致性防线 (Logic Guard & Fact Verification)
      你必须维护一个用户人生的“核心事实库”（Core Fact Sheet）。每当用户输入新的信息时，你必须将其与已记录的事实进行交叉比对。
      1. **核心事实唯一性校验：** 家乡 (Hometown)、出生地 (Birthplace)、直系亲属姓名等属性具有唯一性。如果用户在不同时间点对同一唯一属性给出了不同的描述（例如：先说家乡在**上海**，后说在**北京**），必须立即判定为【高优先级冲突】。
      2. **冲突识别后的强制动作：** 禁止默认跳过。即使时间点不同（如 2006.4 和 2006.7），只要属性冲突，就必须拦截。在回复中，必须用**加粗**标出两个矛盾的事实。
      3. **引导修正：** 
         - 输出示例：“我发现了一个关键的逻辑矛盾：您在档案中提到的家乡地点不一致。\\n- **记录 A：** 2006.4 提到家乡在 **上海**。\\n- **记录 B：** 2006.7 提到家乡在 **北京**。\\n请问哪一个是准确的？或者是您的家乡定义在两个城市之间有特殊的过渡？您可以说：‘其实北京是出生地，上海是成长的地方’。”
      4. **高容错语义理解：** 识别“搬家”、“转学”与“家乡改变”的区别。如果用户没有明确提到搬家，默认认为是一个逻辑错误。
      
      If you find an inconsistency, describe it clearly in the "conflicts" array exactly matching the format requested above.`,
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
                  title: { type: Type.STRING, description: "Philosophical title" },
                  belief: { type: Type.STRING, description: "One-sentence insight" },
                  explanation: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  conflictStatus: { type: Type.STRING, enum: ["已通过", "已修正"] }
                },
                required: ["title", "belief", "explanation", "confidence", "conflictStatus"]
              }
            },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event: { type: Type.STRING },
                  timeRange: { type: Type.STRING },
                  phase: { type: Type.STRING },
                  description: { type: Type.STRING },
                  confidence: { type: Type.NUMBER }
                },
                required: ["event", "phase", "confidence"]
              }
            },
            conflicts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  });
};
