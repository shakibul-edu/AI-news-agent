import React from 'react';
import { Radio, Zap, Facebook, LogOut } from 'lucide-react';
import { FacebookPage } from '../types';

interface HeaderProps {
  connectedPage: FacebookPage | null;
  onConnectFb: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ connectedPage, onConnectFb, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Sambad AI</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Automated News Agent</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`items-center px-3 py-1 rounded-full text-sm font-medium ${connectedPage ? 'bg-blue-50 text-blue-700 border border-blue-200 flex' : 'bg-gray-100 text-gray-600 hidden sm:flex'}`}>
              <Facebook className="w-4 h-4 mr-2" />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {connectedPage ? connectedPage.name : 'No Page Connected'}
              </span>
            </div>
            {!connectedPage && (
              <button 
                onClick={onConnectFb}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors whitespace-nowrap"
              >
                Connect Page
              </button>
            )}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
