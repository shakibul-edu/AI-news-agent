import React from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sambad AI</h1>
        <p className="text-gray-500 mb-8">Secure News Agent Access</p>
        
        <div className="space-y-4">
            <button
                onClick={() => appwriteService.loginWithGoogle()}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
                <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                Continue with Google
            </button>
        </div>

        <p className="mt-8 text-xs text-gray-400">
            Authentication powered by Appwrite.
            <br/>
            Access is limited to 2 agent cycles per day.
        </p>
      </div>
    </div>
  );
};