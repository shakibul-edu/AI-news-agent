import { NewsArticle, ProcessedPost } from "../types";
import { searchNewsAction, generateImageAction, generateBanglaPostAction } from "../app/actions";

// Service Layer
// In Next.js, this calls Server Actions.
// Note: If running purely client-side (without a Next.js server), these calls will fail due to missing server-side API keys.

export const searchNews = async (tags: string[]): Promise<NewsArticle[]> => {
  try {
    const rawData = await searchNewsAction(tags);
    
    if (!rawData) {
        throw new Error("No data received from server action");
    }

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
    console.error("Error in searchNews service:", error);
    // Re-throw to be caught by UI logs
    throw new Error("Failed to fetch news. Ensure you are running this as a Next.js Server (npm run dev) and API_KEY is set in .env");
  }
};

export const generateNewsImage = async (title: string): Promise<string | null> => {
  try {
      return await generateImageAction(title);
  } catch (e) {
      console.warn("Image generation failed:", e);
      return null;
  }
};

export const generateBanglaPost = async (article: NewsArticle): Promise<Omit<ProcessedPost, 'status' | 'timestamp'>> => {
  const dateStr = article.publishedTime ? new Date(article.publishedTime).toLocaleDateString() : 'Today';
  
  try {
    const result = await generateBanglaPostAction(article.title, article.source, article.snippet, dateStr);

    return {
      id: `post-${Date.now()}`,
      originalArticleId: article.id,
      banglaHeadline: result.banglaHeadline || "শিরোনাম পাওয়া যায়নি",
      banglaSummary: result.banglaSummary || "সারাংশ পাওয়া যায়নি",
      hashtags: result.hashtags || []
    };
  } catch (error) {
    console.error("Error in generateBanglaPost service:", error);
    throw new Error("Content generation failed. Check server logs.");
  }
};