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
  status: 'pending' | 'posted' | 'failed';
  timestamp: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'action';
}

export interface AgentConfig {
  tags: string[];
  autoMode: boolean;
  refreshInterval: number; // in seconds
  fbConnected: boolean;
}