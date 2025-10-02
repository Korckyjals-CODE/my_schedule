// Supabase client configuration for frontend
// This will be populated by the server with environment variables

// Get configuration from server-side environment variables
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;

// Function to initialize Supabase with credentials from server
async function initializeSupabase() {
    try {
        // Fetch configuration from server
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            SUPABASE_URL = config.SUPABASE_URL;
            SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
            
            // Store app configuration globally
            window.appConfig = {
                DISABLE_EMAIL_CONFIRMATION: config.DISABLE_EMAIL_CONFIRMATION,
                NODE_ENV: config.NODE_ENV
            };
            
            // Initialize Supabase client
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        } else {
            throw new Error('Failed to load configuration');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

// Authentication state
let currentUser = null;
let authToken = null;

// Check if user is already signed in
async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            const initialized = await initializeSupabase();
            if (!initialized) return false;
        }
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            authToken = session.access_token;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        if (!window.supabaseClient) {
            const initialized = await initializeSupabase();
            if (!initialized) throw new Error('Supabase not initialized');
        }
        
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        currentUser = data.user;
        authToken = data.session.access_token;
        return data;
    } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
    }
}

// Sign up with email and password
async function signUp(email, password) {
    try {
        if (!window.supabaseClient) {
            const initialized = await initializeSupabase();
            if (!initialized) throw new Error('Supabase not initialized');
        }
        
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // Auto-confirm user in development mode
        if (data.user && window.appConfig && window.appConfig.DISABLE_EMAIL_CONFIRMATION) {
            try {
                await autoConfirmUser(data.user.id);
                console.log('User auto-confirmed in development mode');
            } catch (confirmError) {
                console.warn('Failed to auto-confirm user:', confirmError);
                // Don't throw error - user can still confirm manually
            }
        }
        
        return data;
    } catch (error) {
        console.error('Sign up failed:', error);
        throw error;
    }
}

// Auto-confirm user in development mode
async function autoConfirmUser(userId) {
    try {
        const response = await fetch('/api/auth/confirm-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to confirm user');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Auto-confirmation failed:', error);
        throw error;
    }
}

// Sign out
async function signOut() {
    try {
        if (!window.supabaseClient) {
            const initialized = await initializeSupabase();
            if (!initialized) throw new Error('Supabase not initialized');
        }
        
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            throw error;
        }
        
        currentUser = null;
        authToken = null;
    } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
}

// Get auth headers for API calls
function getAuthHeaders() {
    if (!authToken) {
        throw new Error('No authentication token available');
    }
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

// Export functions for use in other scripts
window.supabaseAuth = {
    checkAuth,
    signIn,
    signUp,
    signOut,
    getAuthHeaders,
    getCurrentUser: () => currentUser,
    isAuthenticated: () => !!currentUser
};
