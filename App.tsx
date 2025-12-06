import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AgentControl } from './components/AgentControl';
import { NewsFeed } from './components/NewsFeed';
import { ActivityLog } from './components/ActivityLog';
import { AgentConfig, LogEntry, NewsArticle, ProcessedPost, FacebookPage } from './types';
import { searchNews, generateBanglaPost } from './services/geminiService';

const DEFAULT_TAGS = ['Technology', 'World Politics', 'Science', 'Bangladesh'];

// Extend Window interface for FB SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const App: React.FC = () => {
  const [config, setConfig] = useState<AgentConfig>({
    tags: DEFAULT_TAGS,
    autoMode: false,
    refreshInterval: 60,
    connectedPage: null
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawArticles, setRawArticles] = useState<NewsArticle[]>([]);
  const [processedPosts, setProcessedPosts] = useState<ProcessedPost[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fbSdkLoaded, setFbSdkLoaded] = useState(false);

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

  // Helper to load Facebook SDK
  const loadFacebookSdk = (appId: string) => {
    if (window.FB) {
      setFbSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : appId,
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0'
      });
      setFbSdkLoaded(true);
      addLog('Facebook SDK initialized successfully.', 'success');
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s) as HTMLScriptElement; js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode?.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
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

      // Filter out news we've already seen
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
      runAgentCycle();
      intervalId = setInterval(() => {
        runAgentCycle();
      }, config.refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [config.autoMode, config.refreshInterval, runAgentCycle]);

  // Handle Connecting to Facebook
  const handleConnectFb = () => {
    // 1. Check/Load SDK
    if (!fbSdkLoaded) {
      const appId = window.prompt("To connect, please enter your Facebook App ID (Developers Console):");
      if (!appId) {
        addLog("Connection cancelled. App ID required.", "error");
        return;
      }
      loadFacebookSdk(appId);
      addLog("Loading SDK... Please click 'Connect Page' again once initialized.", "info");
      return;
    }

    addLog("Initiating Facebook Login...", "action");

    // 2. Login & Request Permissions
    window.FB.login((response: any) => {
      if (response.authResponse) {
        addLog("Logged in successfully. Fetching Pages...", "success");
        
        // 3. Fetch Pages
        window.FB.api('/me/accounts', (pageResponse: any) => {
          if (pageResponse && pageResponse.data) {
            const pages = pageResponse.data;
            if (pages.length === 0) {
              addLog("No Facebook Pages found for this account.", "error");
            } else if (pages.length === 1) {
              // Auto select if only 1
              const page = pages[0];
              updateConfig({ connectedPage: { id: page.id, name: page.name, access_token: page.access_token } });
              addLog(`Connected to Page: ${page.name}`, "success");
            } else {
              // Let user choose
              const msg = "Found multiple pages. Enter number to select:\n" + 
                pages.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n');
              
              const selection = window.prompt(msg);
              const index = selection ? parseInt(selection) - 1 : -1;
              
              if (index >= 0 && index < pages.length) {
                const page = pages[index];
                updateConfig({ connectedPage: { id: page.id, name: page.name, access_token: page.access_token } });
                addLog(`Connected to Page: ${page.name}`, "success");
              } else {
                addLog("Invalid selection. Page not connected.", "error");
              }
            }
          } else {
            addLog("Failed to retrieve pages.", "error");
          }
        });
      } else {
        addLog("User cancelled login or did not fully authorize.", "error");
      }
    }, { scope: 'pages_manage_posts,pages_show_list,pages_read_engagement' });
  };

  // Handle Posting to Facebook
  const handlePostToFb = (post: ProcessedPost) => {
    if (!config.connectedPage) {
      addLog('Cannot post: No Facebook Page connected.', 'error');
      return;
    }

    addLog(`Posting to ${config.connectedPage.name}: "${post.banglaHeadline}"...`, 'action');
    
    // Construct the post message
    const message = `${post.banglaHeadline}\n\n${post.banglaSummary}\n\n${post.hashtags.join(' ')}\n\nSource: AI Generated via Sambad Agent`;

    // Call Graph API
    window.FB.api(
      `/${config.connectedPage.id}/feed`,
      'POST',
      {
        message: message,
        access_token: config.connectedPage.access_token
      },
      (response: any) => {
        if (response && !response.error) {
           setProcessedPosts(prev => prev.map(p => 
            p.id === post.id ? { ...p, status: 'posted' } : p
          ));
          addLog(`Successfully posted. Post ID: ${response.id}`, 'success');
        } else {
          addLog(`Failed to post: ${response.error?.message}`, 'error');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header connectedPage={config.connectedPage} onConnectFb={handleConnectFb} />
      
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
            
            {!config.connectedPage && (
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                 <strong>Setup Required:</strong> Click "Connect Page" in the header to link a Facebook Page for auto-posting. You will need a valid Facebook App ID.
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
              fbConnected={!!config.connectedPage}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;