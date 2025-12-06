'use server';

import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function searchNewsAction(tags: string[]) {
  if (!ai) throw new Error("API_KEY not configured on server");

  const tagString = tags.join(", ");
  const prompt = `
    Perform a Google Search to find the latest breaking international news regarding: ${tagString}. 
    Focus on mainstream credible sources (BBC, Reuters, CNN, Al Jazeera, etc.).
    
    Output requirements:
    1. Return strictly a JSON array. 
    2. Do not use markdown code blocks. Just the raw JSON string.
    3. The array should contain exactly 4 distinct news items.
    4. Each item must have: title, source, url, snippet.
    5. only today's news articles.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Validate JSON on server
    const rawData = JSON.parse(text);
    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    console.error("Server Action searchNews failed:", error);
    return [];
  }
}

export async function generateImageAction(title: string) {
  if (!ai) return null;
  
  try {
    const prompt = `Create a symbolic, artistic digital illustration representing: "${title}".
    Style: Professional, abstract, editorial illustration, 16:9 aspect ratio.
    Avoid text, violence, or sensitive real-world imagery. Focus on themes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Server Action generateImage failed:", error);
    return null;
  }
}

export async function generateBanglaPostAction(articleTitle: string, articleSource: string, articleSnippet: string, dateStr: string) {
  if (!ai) throw new Error("API_KEY not configured");

  const prompt = `
    You are a professional senior editor for a Bengali international news portal.
    Task: Translate and expand news summary into detailed Bangla report (150-200 words).
    Tone: Formal, journalistic.
    Requirements: Catchy Headline, Detailed Body, 3-5 Hashtags.
    Explicitly mention Source: ${articleSource} and Date: ${dateStr}.

    Input News:
    Headline: ${articleTitle}
    Content: ${articleSnippet}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            banglaHeadline: { type: Type.STRING },
            banglaSummary: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["banglaHeadline", "banglaSummary", "hashtags"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Server Action generatePost failed:", error);
    throw error;
  }
}