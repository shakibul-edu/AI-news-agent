import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AgentControl } from './components/AgentControl';
import { NewsFeed } from './components/NewsFeed';
import { ActivityLog } from './components/ActivityLog';
import { AgentConfig, LogEntry, NewsArticle, ProcessedPost } from './types';
import { searchNews, generateBanglaPost } from './services/geminiService';

const DEFAULT_TAGS = ['Technology', 'World Politics', 'Science', 'Bangladesh'];

const App: React.FC = () => {
  const [config, setConfig] = useState<AgentConfig>({
    tags: DEFAULT_TAGS,
    autoMode: false,
    refreshInterval: 60,
    fbConnected: false
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawArticles, setRawArticles] = useState<NewsArticle[]>([]);
  const [processedPosts, setProcessedPosts] = useState<ProcessedPost[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to add logs
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    }]);
  };

  const updateConfig = (newConfig: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    if (newConfig.autoMode !== undefined) {
      addLog(`Agent mode set to: ${newConfig.autoMode ? 'AUTOMATIC' : 'MANUAL'}`, 'action');
    }
    if (newConfig.tags) {
      addLog(`Updated watch tags: ${newConfig.tags.join(', ')}`, 'info');
    }
  };

  // Core Agent Logic
  const runAgentCycle = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    addLog('Starting fetch cycle...', 'action');

    try {
      // 1. Fetch News
      addLog(`Searching international news for tags: ${config.tags.join(', ')}...`);
      const newsItems = await searchNews(config.tags);
      
      if (newsItems.length === 0) {
        addLog('No new relevant articles found.', 'info');
        setIsProcessing(false);
        return;
      }

      addLog(`Found ${newsItems.length} articles. Filtering duplicates...`, 'success');

      // Filter out news we've already seen (simple ID check based on URL or Title match ideally, but using ID here for simplicity)
      // In a real app, we'd check against a DB of processed URLs.
      const newArticles = newsItems.filter(item => 
        !rawArticles.some(existing => existing.title === item.title)
      );

      if (newArticles.length === 0) {
        addLog('All found articles have already been processed.', 'info');
        setIsProcessing(false);
        return;
      }

      setRawArticles(prev => [...newArticles, ...prev]);

      // 2. Process News (Translate & Summarize)
      for (const article of newArticles) {
        addLog(`Processing article: "${article.title.substring(0, 30)}..."`, 'info');
        try {
          const processed = await generateBanglaPost(article);
          
          setProcessedPosts(prev => [{
            ...processed,
            status: 'pending',
            timestamp: Date.now()
          }, ...prev]);
          
          addLog(`Translated & Summarized: ${processed.banglaHeadline}`, 'success');
        } catch (err) {
          addLog(`Failed to process article: ${article.title}`, 'error');
        }
      }

    } catch (error) {
      addLog(`Error during agent cycle: ${(error as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
      addLog('Cycle complete.', 'info');
    }
  }, [config.tags, isProcessing, rawArticles]);

  // Auto-mode Effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (config.autoMode) {
      // Run immediately on start
      runAgentCycle();
      
      // Then set interval
      intervalId = setInterval(() => {
        runAgentCycle();
      }, config.refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [config.autoMode, config.refreshInterval, runAgentCycle]);

  // Handlers
  const handlePostToFb = (post: ProcessedPost) => {
    if (!config.fbConnected) {
      addLog('Cannot post: Facebook Page not connected.', 'error');
      return;
    }

    addLog(`Posting to Facebook: "${post.banglaHeadline}"...`, 'action');
    
    // Simulate API call delay
    setTimeout(() => {
      setProcessedPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, status: 'posted' } : p
      ));
      addLog('Successfully posted to Facebook Page.', 'success');
    }, 1500);
  };

  const handleConnectFb = () => {
    const pageInfo = window.prompt("Please enter your Facebook Page Name or ID to connect:");
    
    if (pageInfo && pageInfo.trim().length > 0) {
      updateConfig({ fbConnected: true });
      addLog(`Successfully connected to Facebook Page: "${pageInfo}"`, 'success');
    } else if (pageInfo !== null) {
      addLog('Connection cancelled: No Page Name/ID provided.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header fbConnected={config.fbConnected} onConnectFb={handleConnectFb} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls & Logs */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 h-fit">
            <AgentControl 
              config={config} 
              updateConfig={updateConfig} 
              isProcessing={isProcessing}
              onManualTrigger={runAgentCycle}
            />
            
            <ActivityLog logs={logs} />

            {!process.env.API_KEY && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                 <strong>Warning:</strong> No API_KEY detected. The agent cannot fetch or process news. Please check your environment variables.
               </div>
            )}
          </div>

          {/* Right Main Area: News Feed */}
          <div className="lg:col-span-8">
            <NewsFeed 
              processedPosts={processedPosts}
              rawArticles={rawArticles}
              onPostToFb={handlePostToFb}
              onConnectFb={handleConnectFb}
              fbConnected={config.fbConnected}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;