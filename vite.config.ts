import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.VITE_APPWRITE_ENDPOINT': JSON.stringify(env.VITE_APPWRITE_ENDPOINT),
        'process.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(env.VITE_APPWRITE_PROJECT_ID),
        'process.env.VITE_APPWRITE_DB_ID': JSON.stringify(env.VITE_APPWRITE_DB_ID),
        'process.env.VITE_APPWRITE_COLLECTION_USERS': JSON.stringify(env.VITE_APPWRITE_COLLECTION_USERS),
        'process.env.VITE_APPWRITE_COLLECTION_POSTS': JSON.stringify(env.VITE_APPWRITE_COLLECTION_POSTS)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
