'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { AgentControl } from './AgentControl';
import { NewsFeed } from './NewsFeed';
import { ActivityLog } from './ActivityLog';
import { Login } from './Login';
import { HistoryLog } from './HistoryLog';
import { AgentConfig, LogEntry, NewsArticle, ProcessedPost, FacebookPage, UserProfile, PostHistoryItem } from '../types';
import { searchNews, generateBanglaPost, generateNewsImage } from '../services/geminiService';
import { appwriteService } from '../services/appwriteService';

const DEFAULT_TAGS = ['Technology', 'World Politics', 'Science', 'Bangladesh'];
const DAILY_LIMIT = 2;

// Extend Window interface for FB SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [usageCount, setUsageCount] = useState(0);
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);

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
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    }]);
  }, []);

  // Initialize Auth & Appwrite
  useEffect(() => {
    let mounted = true;
    const init = async () => {
        try {
            const currentUser = await appwriteService.getCurrentUser();
            if (mounted && currentUser) {
                setUser({ id: currentUser.$id, name: currentUser.name, email: currentUser.email });
                addLog(`Welcome back, ${currentUser.name}`, 'success');
                
                // Restore Page Connection
                const savedPage = await appwriteService.getPageConnection(currentUser.$id);
                if (savedPage) {
                    setConfig(prev => ({ ...prev, connectedPage: savedPage }));
                    addLog(`Restored connection to page: ${savedPage.name}`, 'info');
                }

                // Fetch History
                const history = await appwriteService.getHistory(currentUser.$id);
                setPostHistory(history);

                // Check Limits
                const count = await appwriteService.getTodayUsageCount(currentUser.$id);
                setUsageCount(count);
            }
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            if (mounted) setLoadingAuth(false);
        }
    };
    init();
    return () => { mounted = false; };
  }, [addLog]);

  const handleLogout = async () => {
    await appwriteService.logout();
    setUser(null);
    setRawArticles([]);
    setProcessedPosts([]);
    setLogs([]);
    addLog("Logged out successfully", "info");
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

    if (usageCount >= DAILY_LIMIT) {
        addLog(`Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Please try again tomorrow.`, 'error');
        setConfig(prev => ({...prev, autoMode: false}));
        return;
    }

    setIsProcessing(true);
    addLog(`Starting cycle. Usage today: ${usageCount + 1}/${DAILY_LIMIT}`, 'action');

    try {
      addLog(`Searching international news for tags: ${config.tags.join(', ')}...`);
      const newsItems = await searchNews(config.tags);
      
      if (newsItems.length === 0) {
        addLog('No new relevant articles found.', 'info');
        setIsProcessing(false);
        return;
      }

      addLog(`Found ${newsItems.length} articles. Filtering duplicates...`, 'success');

      const newArticles = newsItems.filter(item => 
        !rawArticles.some(existing => existing.title === item.title)
      );

      if (newArticles.length === 0) {
        addLog('All found articles have already been processed.', 'info');
        setIsProcessing(false);
        return;
      }

      setRawArticles(prev => [...newArticles, ...prev]);

      for (const article of newArticles) {
        addLog(`Processing article: "${article.title.substring(0, 30)}..."`, 'info');
        try {
          addLog(`Generating Bangla content and AI image...`, 'action');
          
          const [processedText, imageUrl] = await Promise.all([
            generateBanglaPost(article),
            generateNewsImage(article.title)
          ]);
          
          setProcessedPosts(prev => [{
            ...processedText,
            imageUrl: imageUrl || undefined,
            status: 'pending',
            timestamp: Date.now()
          }, ...prev]);
          
          addLog(`Content ready: ${processedText.banglaHeadline}`, 'success');
          if (imageUrl) addLog(`Image generated successfully.`, 'success');

        } catch (err) {
          addLog(`Failed to process article: ${(err as Error).message}`, 'error');
        }
      }

    } catch (error) {
      addLog(`Error during agent cycle: ${(error as Error).message}`, 'error');
    } finally {
      setIsProcessing(false);
      addLog('Cycle complete.', 'info');
    }
  }, [config.tags, isProcessing, rawArticles, usageCount, addLog]);

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

  const handleConnectFb = () => {
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

    window.FB.login((response: any) => {
      if (response.authResponse) {
        addLog("Logged in successfully. Fetching Pages...", "success");
        window.FB.api('/me/accounts', (pageResponse: any) => {
          if (pageResponse && pageResponse.data) {
            const pages = pageResponse.data;
            if (pages.length === 0) {
              addLog("No Facebook Pages found for this account.", "error");
            } else if (pages.length === 1) {
              connectPage(pages[0]);
            } else {
              const msg = "Found multiple pages. Enter number to select:\n" + 
                pages.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n');
              const selection = window.prompt(msg);
              const index = selection ? parseInt(selection) - 1 : -1;
              if (index >= 0 && index < pages.length) {
                connectPage(pages[index]);
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
    }, { scope: 'pages_manage_posts,pages_show_list' });
  };

  const connectPage = async (page: any) => {
      const fbPage: FacebookPage = { id: page.id, name: page.name, access_token: page.access_token };
      updateConfig({ connectedPage: fbPage });
      addLog(`Connected to Page: ${page.name}`, "success");
      
      if (user) {
          await appwriteService.savePageConnection(user.id, fbPage);
          addLog("Page connection saved to database.", "success");
      }
  };

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handlePostToFb = async (post: ProcessedPost) => {
    if (!config.connectedPage) {
      addLog('Cannot post: No Facebook Page connected.', 'error');
      return;
    }

    addLog(`Posting to ${config.connectedPage.name}: "${post.banglaHeadline}"...`, 'action');
    const message = `${post.banglaHeadline}\n\n${post.banglaSummary}\n\n${post.hashtags.join(' ')}\n`;

    try {
      let fbPostId = '';
      if (post.imageUrl) {
        const blob = dataURItoBlob(post.imageUrl);
        const formData = new FormData();
        formData.append('access_token', config.connectedPage.access_token);
        formData.append('source', blob);
        formData.append('message', message);
        formData.append('published', 'true');

        const response = await fetch(`https://graph.facebook.com/${config.connectedPage.id}/photos`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.id) {
            fbPostId = data.post_id || data.id;
        } else {
           throw new Error(data.error?.message || 'Unknown FB API Error');
        }
      } else {
        fbPostId = await new Promise((resolve, reject) => {
            window.FB.api(
                `/${config.connectedPage.id}/feed`,
                'POST',
                {
                  message: message,
                  access_token: config.connectedPage!.access_token
                },
                (response: any) => {
                  if (response && !response.error) {
                     resolve(response.id);
                  } else {
                    reject(new Error(response.error?.message));
                  }
                }
              );
        });
      }

      setProcessedPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'posted' } : p));
      addLog(`Successfully posted. Post ID: ${fbPostId}`, 'success');
      
      if (user) {
          const newHistoryItem: PostHistoryItem = {
              headline: post.banglaHeadline,
              summary: post.banglaSummary,
              fbPostId: fbPostId,
              pageName: config.connectedPage.name,
              postedAt: new Date().toISOString()
          };
          await appwriteService.savePostToHistory(user.id, newHistoryItem);
          setPostHistory(prev => [newHistoryItem, ...prev]);
          setUsageCount(prev => prev + 1);
      }

    } catch (e: any) {
      addLog(`Failed to post: ${e.message}`, 'error');
    }
  };

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Initializing Agent...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header connectedPage={config.connectedPage} onConnectFb={handleConnectFb} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20 h-fit">
            <AgentControl 
              config={config} 
              updateConfig={updateConfig} 
              isProcessing={isProcessing}
              onManualTrigger={runAgentCycle}
            />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                 <div className="flex justify-between items-center text-sm mb-2">
                     <span className="text-gray-500">Daily Limit Usage</span>
                     <span className={`font-semibold ${usageCount >= DAILY_LIMIT ? 'text-red-600' : 'text-green-600'}`}>
                         {usageCount} / {DAILY_LIMIT}
                     </span>
                 </div>
                 <div className="w-full bg-gray-200 rounded-full h-2">
                     <div 
                        className={`h-2 rounded-full ${usageCount >= DAILY_LIMIT ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min((usageCount / DAILY_LIMIT) * 100, 100)}%` }}
                     ></div>
                 </div>
            </div>
            <ActivityLog logs={logs} />
            <HistoryLog history={postHistory} />
          </div>
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