import React from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col h-[300px]">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center">
        <Terminal className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-xs font-mono text-gray-300">System Activity</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
        {logs.length === 0 && <span className="text-gray-600">System initialized. Waiting for tasks...</span>}
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className="flex items-start">
            <span className="text-gray-500 mr-3 min-w-[60px]">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`break-words ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'action' ? 'text-blue-400' :
              'text-gray-300'
            }`}>
              {log.type === 'action' && '> '}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};