import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Settings, Tag, Plus, X } from 'lucide-react';
import { AgentConfig } from '../types';

interface AgentControlProps {
  config: AgentConfig;
  updateConfig: (newConfig: Partial<AgentConfig>) => void;
  isProcessing: boolean;
  onManualTrigger: () => void;
}

export const AgentControl: React.FC<AgentControlProps> = ({ config, updateConfig, isProcessing, onManualTrigger }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !config.tags.includes(newTag)) {
      updateConfig({ tags: [...config.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateConfig({ tags: config.tags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-500" />
          Agent Control
        </h2>
        <div className={`w-3 h-3 rounded-full ${config.autoMode ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={config.autoMode ? "Live" : "Standby"}></div>
      </div>

      {/* Main Action Button */}
      <div className="mb-6">
        <button
          onClick={() => updateConfig({ autoMode: !config.autoMode })}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
            config.autoMode 
              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' 
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-blue-500/30'
          }`}
        >
          {config.autoMode ? (
            <>
              <Pause className="w-4 h-4 mr-2" /> Stop Agent
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Start Agent
            </>
          )}
        </button>
        
        <button
          onClick={onManualTrigger}
          disabled={isProcessing || config.autoMode}
          className="mt-2 w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          Fetch & Process Now
        </button>
      </div>

      {/* Tags Configuration */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 block">Watch Topics</label>
        <div className="flex">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add topic (e.g. Tech)"
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleAddTag}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {config.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1.5 inline-flex items-center justify-center text-indigo-400 hover:text-indigo-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Update Frequency</span>
          <span>{config.refreshInterval}s</span>
        </div>
        <input 
          type="range" 
          min="30" 
          max="300" 
          step="30"
          value={config.refreshInterval}
          onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>
    </div>
  );
};