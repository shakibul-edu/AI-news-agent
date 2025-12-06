import { Client, Account, Databases, ID, Query } from 'appwrite';
import { FacebookPage, PostHistoryItem } from '../types';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID; 
const DB_ID = process.env.APPWRITE_DB_ID || 'sambad-db';
const COLL_USERS = process.env.APPWRITE_COLLECTION_USERS || 'user_configs';
const COLL_POSTS = process.env.APPWRITE_COLLECTION_POSTS || 'posts';

// Initialize Client
const client = new Client();
client.setEndpoint(ENDPOINT);

if (PROJECT_ID) {
    client.setProject(PROJECT_ID);
} else {
    console.warn("Appwrite Project ID is missing. Auth calls will fail.");
}

const account = new Account(client);
const databases = new Databases(client);

export const appwriteService = {
    client,
    account,
    
    // Auth
    loginWithGoogle: () => {
        if (!PROJECT_ID) {
            alert("Configuration Error: APPWRITE_PROJECT_ID is missing.");
            return;
        }
        // Redirects to current URL after login
        // We catch immediate sync errors, but async errors happen on the redirect target
        try {
            account.createOAuth2Session('google', window.location.href, window.location.href);
        } catch (e) {
            console.error("Failed to initiate Google Login", e);
            alert("Failed to initiate login. Check console for details.");
        }
    },

    getCurrentUser: async () => {
        if (!PROJECT_ID) return null;
        try {
            return await account.get();
        } catch (e) {
            // Not logged in or error
            return null;
        }
    },

    logout: async () => {
        try {
            await account.deleteSession('current');
        } catch (e) {
            console.error("Logout failed", e);
        }
    },

    // User Configuration (Facebook Page Connection)
    savePageConnection: async (userId: string, page: FacebookPage) => {
        if (!PROJECT_ID) return;
        try {
            // Check if config exists
            const list = await databases.listDocuments(DB_ID, COLL_USERS, [
                Query.equal('user_id', userId)
            ]);

            const payload = {
                user_id: userId,
                page_id: page.id,
                page_name: page.name,
                access_token: page.access_token
            };

            if (list.total > 0) {
                // Update
                await databases.updateDocument(DB_ID, COLL_USERS, list.documents[0].$id, payload);
            } else {
                // Create
                await databases.createDocument(DB_ID, COLL_USERS, ID.unique(), payload);
            }
        } catch (e) {
            console.error("Failed to save page config", e);
        }
    },

    getPageConnection: async (userId: string): Promise<FacebookPage | null> => {
        if (!PROJECT_ID) return null;
        try {
            const list = await databases.listDocuments(DB_ID, COLL_USERS, [
                Query.equal('user_id', userId)
            ]);
            
            if (list.total > 0) {
                const doc = list.documents[0];
                return {
                    id: doc.page_id,
                    name: doc.page_name,
                    access_token: doc.access_token
                };
            }
        } catch (e) {
            console.warn("No saved page config found. This is normal for new users.", e);
        }
        return null;
    },

    // History & Usage Limits
    getTodayUsageCount: async (userId: string): Promise<number> => {
        if (!PROJECT_ID) return 0;
        
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        try {
            const list = await databases.listDocuments(DB_ID, COLL_POSTS, [
                Query.equal('user_id', userId),
                Query.greaterThanEqual('postedAt', startOfDay.toISOString())
            ]);
            return list.total;
        } catch (e) {
            console.error("Failed to check usage limit", e);
            return 0;
        }
    },

    savePostToHistory: async (userId: string, post: PostHistoryItem) => {
        if (!PROJECT_ID) return;
        try {
            await databases.createDocument(DB_ID, COLL_POSTS, ID.unique(), {
                user_id: userId,
                headline: post.headline,
                summary: post.summary.substring(0, 500), // Limit summary size for DB
                fb_post_id: post.fbPostId,
                page_name: post.pageName,
                postedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Failed to save history", e);
        }
    },

    getHistory: async (userId: string): Promise<PostHistoryItem[]> => {
        if (!PROJECT_ID) return [];
        try {
            const list = await databases.listDocuments(DB_ID, COLL_POSTS, [
                Query.equal('user_id', userId),
                Query.orderDesc('postedAt'),
                Query.limit(20)
            ]);
            
            return list.documents.map(doc => ({
                $id: doc.$id,
                headline: doc.headline,
                summary: doc.summary,
                fbPostId: doc.fb_post_id,
                pageName: doc.page_name,
                postedAt: doc.postedAt
            }));
        } catch (e) {
            console.error("Failed to fetch history", e);
            return [];
        }
    }
};