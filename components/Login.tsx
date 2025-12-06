import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { appwriteService } from '../services/appwriteService';

export const Login: React.FC = () => {
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const isConfigured = !!projectId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sambad AI</h1>
        <p className="text-gray-500 mb-8">Secure News Agent Access</p>
        
        {isConfigured ? (
            <div className="space-y-4">
                <button
                    onClick={() => appwriteService.loginWithGoogle()}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Continue with Google
                </button>
            </div>
        ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2 text-red-700 font-bold">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Configuration Missing
                </div>
                <p className="text-sm text-red-600">
                    APPWRITE_PROJECT_ID is missing in your environment variables.
                </p>
            </div>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">
                Authentication powered by Appwrite.
            </p>
            {isConfigured && (
                <div className="text-[10px] text-gray-300 bg-gray-50 p-2 rounded">
                    Project ID: {projectId}
                    <br/>
                    (Verify this matches your Appwrite Console)
                </div>
            )}
        </div>
      </div>
    </div>
  );
};