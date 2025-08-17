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
        
        return data;
    } catch (error) {
        console.error('Sign up failed:', error);
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
