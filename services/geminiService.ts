import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, ProcessedPost } from "../types";

// Helper to get client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const searchNews = async (tags: string[]): Promise<NewsArticle[]> => {
  const ai = getClient();
  const tagString = tags.join(", ");
  
  const prompt = `
    Perform a Google Search to find the latest breaking international news regarding: ${tagString}. 
    Focus on mainstream credible sources (BBC, Reuters, CNN, Al Jazeera, etc.).
    
    Output requirements:
    1. Return strictly a JSON array. 
    2. Do not use markdown code blocks (no \`\`\`json). Just the raw JSON string.
    3. The array should contain exactly 4 distinct news items.
    4. Each item must have the following fields:
       - title: Headline of the news
       - source: Name of the news outlet
       - url: The link to the article found in search results
       - snippet: A short summary of the event
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

    let rawData;
    try {
        rawData = JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse JSON from news search, raw text:", text);
        return [];
    }

    if (!Array.isArray(rawData)) return [];
    
    return rawData.map((item: any, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      title: item.title,
      source: item.source,
      url: item.url || '#',
      snippet: item.snippet,
      tags: tags,
      publishedTime: new Date().toISOString()
    }));

  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

export const generateNewsImage = async (title: string): Promise<string | null> => {
  const ai = getClient();
  try {
    // Simplified prompt for better compatibility
    const prompt = `Generate a news illustration for the headline: "${title}". 
    The style should be a high-quality, realistic, dramatic news thumbnail. 
    16:9 aspect ratio. Do not include text in the image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });
    
    // Check candidates for image data
    const candidate = response.candidates?.[0];
    
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    // If we got here, check if there was a text refusal or error in the response
    if (candidate?.content?.parts?.[0]?.text) {
        console.warn("Image generation returned text instead of image:", candidate.content.parts[0].text);
    }
    
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const generateBanglaPost = async (article: NewsArticle): Promise<Omit<ProcessedPost, 'status' | 'timestamp'>> => {
  const ai = getClient();
  const dateStr = article.publishedTime ? new Date(article.publishedTime).toLocaleDateString() : 'Today';

  const prompt = `
    You are a professional senior editor for a Bengali international news portal.
    
    Task:
    1. Translate and expand upon the news summary into a detailed Bengali (Bangla) news report.
    2. The report should be substantial (approx. 150-200 words), covering the context, the event, and potential implications. Do NOT be brief.
    3. Use a formal, journalistic, and engaging tone.
    4. Create a catchy, click-worthy headline in Bangla.
    5. Generate 3-5 relevant hashtags (English/Bangla mix).
    6. Explicitly mention the Source Name and Date at the end of the text.

    Input News:
    Headline: ${article.title}
    Source: ${article.source}
    Date: ${dateStr}
    Content: ${article.snippet}
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
            hashtags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["banglaHeadline", "banglaSummary", "hashtags"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    return {
      id: `post-${Date.now()}`,
      originalArticleId: article.id,
      banglaHeadline: result.banglaHeadline || "শিরোনাম পাওয়া যায়নি",
      banglaSummary: result.banglaSummary || "সারাংশ পাওয়া যায়নি",
      hashtags: result.hashtags || []
    };

  } catch (error) {
    console.error("Error processing article:", error);
    throw error;
  }
};