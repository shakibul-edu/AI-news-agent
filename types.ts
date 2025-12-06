export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedTime?: string;
  snippet: string;
  tags: string[];
}

export interface ProcessedPost {
  id: string;
  originalArticleId: string;
  banglaHeadline: string;
  banglaSummary: string;
  hashtags: string[];
  imageUrl?: string;
  status: 'pending' | 'posted' | 'failed';
  timestamp: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'action';
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface AgentConfig {
  tags: string[];
  autoMode: boolean;
  refreshInterval: number; // in seconds
  connectedPage: FacebookPage | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface PostHistoryItem {
  $id?: string;
  headline: string;
  summary: string;
  fbPostId: string;
  pageName: string;
  postedAt: string;
}