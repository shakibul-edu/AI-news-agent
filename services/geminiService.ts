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
  
  // We use the search tool to find news, but we ask for JSON output to parse it easily.
  const prompt = `Find the latest breaking international news regarding: ${tagString}. 
  Focus on mainstream credible sources (BBC, Reuters, CNN, Al Jazeera, etc.).
  Return a list of 4 distinct news items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Headline of the news" },
              source: { type: Type.STRING, description: "Name of the news outlet" },
              url: { type: Type.STRING, description: "URL to the article if available, otherwise leave empty" },
              snippet: { type: Type.STRING, description: "A short summary of the event" },
            },
            required: ["title", "source", "snippet"]
          }
        }
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    
    // Map to our internal type
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

export const generateBanglaPost = async (article: NewsArticle): Promise<Omit<ProcessedPost, 'status' | 'timestamp'>> => {
  const ai = getClient();

  const prompt = `
    You are a professional social media manager for a Bengali news page.
    
    Task:
    1. Translate the following news summary into formal but engaging Bengali (Bangla).
    2. Create a catchy headline in Bangla.
    3. Summarize the key points in 2-3 sentences max.
    4. Generate 3-5 relevant hashtags in English or Bangla mixed.

    Input News:
    Headline: ${article.title}
    Source: ${article.source}
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