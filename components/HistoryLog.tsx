import React from 'react';
import { History, Facebook } from 'lucide-react';
import { PostHistoryItem } from '../types';

interface HistoryLogProps {
    history: PostHistoryItem[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <History className="w-5 h-5 mr-2 text-gray-500" />
                    Post History
                </h2>
                <span className="text-xs text-gray-400">{history.length} posts</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {history.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">No history available.</p>
                )}
                {history.map((item) => (
                    <div key={item.$id || Math.random()} className="text-sm border-b border-gray-50 pb-2 last:border-0">
                        <div className="font-medium text-gray-900 line-clamp-1">{item.headline}</div>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                                <Facebook className="w-3 h-3 mr-1" />
                                {item.pageName}
                            </span>
                            <span>{new Date(item.postedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};