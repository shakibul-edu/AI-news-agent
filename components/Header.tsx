import React from 'react';
import { Radio, Zap, Facebook } from 'lucide-react';

interface HeaderProps {
  fbConnected: boolean;
  onConnectFb: () => void;
}

export const Header: React.FC<HeaderProps> = ({ fbConnected, onConnectFb }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sambad AI</h1>
              <p className="text-xs text-gray-500 font-medium">Automated News Agent</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${fbConnected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600'}`}>
              <Facebook className="w-4 h-4 mr-2" />
              {fbConnected ? 'Page Connected' : 'No Page Connected'}
            </div>
            {!fbConnected && (
              <button 
                onClick={onConnectFb}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Connect Page
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};