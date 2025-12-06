import React from 'react';
import { ExternalLink, CheckCircle, Clock, Share2, Globe, AlertCircle, Link, Image as ImageIcon } from 'lucide-react';
import { NewsArticle, ProcessedPost } from '../types';

interface NewsFeedProps {
  processedPosts: ProcessedPost[];
  rawArticles: NewsArticle[];
  onPostToFb: (post: ProcessedPost) => void;
  onConnectFb: () => void;
  fbConnected: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ processedPosts, rawArticles, onPostToFb, onConnectFb, fbConnected }) => {
  
  if (processedPosts.length === 0 && rawArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        <Globe className="w-12 h-12 mb-4 opacity-20" />
        <p>No news collected yet.</p>
        <p className="text-sm mt-2">Start the agent to begin monitoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Ready to Post Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Content (Ready for FB)</h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {processedPosts.filter(p => p.status === 'pending').length} Pending
          </span>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {processedPosts.map((post) => {
            const original = rawArticles.find(a => a.id === post.originalArticleId);
            return (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                
                {post.imageUrl && (
                  <div className="w-full h-48 bg-gray-100 overflow-hidden border-b border-gray-100">
                    <img src={post.imageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        AI Translated
                        </span>
                        {post.imageUrl && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                            <ImageIcon className="w-3 h-3 mr-1" /> AI Image
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(post.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {/* Bangla Content */}
                  <div className="font-bengali">
                    <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {post.banglaHeadline}
                    </h4>
                    <p className="text-gray-600 text-base leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.banglaSummary}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4 text-blue-600 text-sm font-medium">
                      {post.hashtags.map((tag, i) => (
                        <span key={i}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                      ))}
                    </div>
                  </div>

                  {/* Context Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <div className="flex items-center text-xs text-gray-500 max-w-[60%] truncate">
                        <span className="mr-1">Source:</span>
                        <a href={original?.url} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600 hover:underline truncate">
                           {original?.source || 'Unknown'} <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                     </div>
                     
                     {post.status === 'posted' ? (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" /> Posted
                        </span>
                     ) : (
                       <button
                         onClick={() => fbConnected ? onPostToFb(post) : onConnectFb()}
                         className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                           fbConnected 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                         }`}
                       >
                         {fbConnected ? <Share2 className="w-4 h-4 mr-2" /> : <Link className="w-4 h-4 mr-2" />}
                         {fbConnected ? 'Post Now' : 'Connect FB'}
                       </button>
                     )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Raw Feed Section */}
      <section className="pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-opacity-70">Raw Incoming Stream</h3>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="space-y-4">
            {rawArticles.slice().reverse().map((article) => (
               <div key={article.id} className="flex items-start p-3 bg-white rounded-lg border border-gray-100">
                 <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {article.title}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{article.snippet}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{article.source}</span>
                      {article.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{tag}</span>
                      ))}
                    </div>
                 </div>
                 <a 
                   href={article.url} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="ml-4 text-gray-400 hover:text-gray-600"
                 >
                   <ExternalLink className="w-4 h-4" />
                 </a>
               </div>
            ))}
             {rawArticles.length === 0 && (
               <div className="text-center py-4 text-sm text-gray-500">Waiting for news stream...</div>
             )}
          </div>
        </div>
      </section>
    </div>
  );
};