import { NewsArticle, ProcessedPost } from "../types";
import { searchNewsAction, generateImageAction, generateBanglaPostAction } from "../app/actions";

// This service now acts as a client-side bridge to Server Actions
// ensuring the API Key remains secure on the server.

export const searchNews = async (tags: string[]): Promise<NewsArticle[]> => {
  try {
    const rawData = await searchNewsAction(tags);
    
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
    throw error;
  }
};

export const generateNewsImage = async (title: string): Promise<string | null> => {
  return await generateImageAction(title);
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
    throw error;
  }
};