// Test User Management System for Development and Testing
// This module provides utilities for managing test users in development environments

class TestUserManager {
    static async createTestUser(email, password) {
        try {
            // First try to create user directly with Supabase client
            if (!window.supabaseClient) {
                const initialized = await window.supabaseAuth.initializeSupabase();
                if (!initialized) throw new Error('Supabase not initialized');
            }
            
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password
            });
            
            if (error && !error.message.includes('already registered')) {
                throw error;
            }
            
            // Auto-confirm in development mode
            if (window.appConfig && window.appConfig.NODE_ENV === 'development' && window.appConfig.DISABLE_EMAIL_CONFIRMATION) {
                try {
                    await this.confirmUser(data.user.id);
                } catch (confirmError) {
                    console.warn('Failed to auto-confirm test user:', confirmError);
                }
            }
            
            return data;
        } catch (error) {
            console.error('Failed to create test user:', error);
            throw error;
        }
    }
    
    static async confirmUser(userId) {
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
            console.error('Failed to confirm user:', error);
            throw error;
        }
    }
    
    static async cleanupTestUsers() {
        try {
            const response = await fetch('/api/test/cleanup-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cleanup test users');
            }
            
            const result = await response.json();
            console.log('Test user cleanup completed:', result);
            
            return result;
        } catch (error) {
            console.error('Failed to cleanup test users:', error);
            throw error;
        }
    }
    
    static async generateTestUser() {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        return {
            email: `test_user_${timestamp}_${randomId}@testdomain.com`,
            password: 'TestPassword123!'
        };
    }
    
    static async createMultipleTestUsers(count = 3) {
        const users = [];
        for (let i = 0; i < count; i++) {
            const userData = await this.generateTestUser();
            try {
                const result = await this.createTestUser(userData.email, userData.password);
                users.push({
                    ...userData,
                    id: result.user.id,
                    created: true
                });
            } catch (error) {
                users.push({
                    ...userData,
                    created: false,
                    error: error.message
                });
            }
        }
        return users;
    }
}

// Advanced Error Recovery Mechanisms
class ErrorRecoveryManager {
    static retryQueue = [];
    static maxRetries = 3;
    static baseDelay = 1000; // 1 second
    
    static async retryAuthRequest(operation, context = 'Auth operation') {
        let attempts = 0;
        let lastError;
        
        while (attempts < this.maxRetries) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                attempts++;
                
                if (attempts < this.maxRetries) {
                    const delay = this.calculateBackoffDelay(attempts);
                    console.log(`${context} failed (attempt ${attempts}), retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`);
    }
    
    static calculateBackoffDelay(attempt) {
        // Exponential backoff with jitter
        const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, 10000); // Max 10 seconds
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static async handleAuthError(error, context = 'Authentication') {
        console.error(`${context} error:`, error);
        
        // Log error for monitoring
        if (window.logAuthError) {
            window.logAuthError(error, context);
        }
        
        // Handle specific error types
        if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
            return this.handleRateLimitError(error);
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return this.handleNetworkError(error);
        }
        
        if (error.message.includes('session') || error.message.includes('token')) {
            return this.handleSessionError(error);
        }
        
        // Default error handling
        throw error;
    }
    
    static async handleRateLimitError(error) {
        console.warn('Rate limit detected, implementing backoff strategy');
        const delay = this.calculateBackoffDelay(1);
        await this.sleep(delay);
        throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    
    static async handleNetworkError(error) {
        console.warn('Network error detected, attempting recovery');
        // Could implement network recovery strategies here
        throw new Error('Network error. Please check your connection and try again.');
    }
    
    static async handleSessionError(error) {
        console.warn('Session error detected, attempting recovery');
        // Could implement session recovery strategies here
        if (window.refreshSession) {
            try {
                await window.refreshSession();
                return; // Session recovered
            } catch (refreshError) {
                console.error('Session recovery failed:', refreshError);
            }
        }
        throw new Error('Session expired. Please sign in again.');
    }
}

// Error Logging and Monitoring System
class ErrorLogger {
    static logError(error, context = 'Application', metadata = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message || error.toString(),
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: window.supabaseAuth ? window.supabaseAuth.getCurrentUser()?.id : null,
            metadata: metadata
        };
        
        console.error('Error logged:', errorLog);
        
        // Store in localStorage for debugging (in development)
        if (window.appConfig && window.appConfig.NODE_ENV === 'development') {
            ErrorLogger.storeErrorLocally(errorLog);
        }
        
        // Send to monitoring service (if available)
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Error Occurred', {
                error_message: errorLog.message,
                error_context: context,
                error_stack: errorLog.stack
            });
        }
        
        // Return true to indicate successful logging
        return true;
    }
    
    static logAuthEvent(eventType, metadata = {}) {
        const authLog = {
            timestamp: new Date().toISOString(),
            event: eventType,
            userId: window.supabaseAuth ? window.supabaseAuth.getCurrentUser()?.id : null,
            metadata: metadata
        };
        
        console.log('Auth event logged:', authLog);
        
        // Send to analytics
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Auth Event', {
                event_type: eventType,
                ...metadata
            });
        }
        
        // Return true to indicate successful logging
        return true;
    }
    
    static logPerformance(operation, duration, metadata = {}) {
        const perfLog = {
            timestamp: new Date().toISOString(),
            operation: operation,
            duration: duration,
            metadata: metadata
        };
        
        console.log('Performance logged:', perfLog);
        
        // Send to analytics
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Performance Metric', {
                operation: operation,
                duration: duration,
                ...metadata
            });
        }
    }
    
    static storeErrorLocally(errorLog) {
        try {
            const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            existingErrors.push(errorLog);
            
            // Keep only last 50 errors
            if (existingErrors.length > 50) {
                existingErrors.splice(0, existingErrors.length - 50);
            }
            
            localStorage.setItem('errorLogs', JSON.stringify(existingErrors));
        } catch (error) {
            console.error('Failed to store error locally:', error);
        }
    }
    
    static getStoredErrors() {
        try {
            return JSON.parse(localStorage.getItem('errorLogs') || '[]');
        } catch (error) {
            console.error('Failed to retrieve stored errors:', error);
            return [];
        }
    }
}

// Performance Monitoring for Auth Operations
class PerformanceTracker {
    static measureAuthTiming(operation, fn) {
        const startTime = performance.now();
        
        return fn().then(result => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.logAuthPerformance(operation, duration);
            return result;
        }).catch(error => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.logAuthPerformance(operation, duration, { error: error.message });
            throw error;
        });
    }
    
    static logAuthPerformance(operation, duration, metadata = {}) {
        const perfData = {
            operation: operation,
            duration: duration,
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        console.log('Auth performance:', perfData);
        
        // Log to ErrorLogger
        if (window.ErrorLogger) {
            window.ErrorLogger.logPerformance(operation, duration, metadata);
        }
        
        // Store performance metrics
        this.storePerformanceMetric(perfData);
    }
    
    static storePerformanceMetric(perfData) {
        try {
            const existingMetrics = JSON.parse(localStorage.getItem('authPerformanceMetrics') || '[]');
            existingMetrics.push(perfData);
            
            // Keep only last 100 metrics
            if (existingMetrics.length > 100) {
                existingMetrics.splice(0, existingMetrics.length - 100);
            }
            
            localStorage.setItem('authPerformanceMetrics', JSON.stringify(existingMetrics));
        } catch (error) {
            console.error('Failed to store performance metric:', error);
        }
    }
    
    static getPerformanceMetrics() {
        try {
            return JSON.parse(localStorage.getItem('authPerformanceMetrics') || '[]');
        } catch (error) {
            console.error('Failed to retrieve performance metrics:', error);
            return [];
        }
    }
    
    static getAveragePerformance(operation) {
        const metrics = this.getPerformanceMetrics();
        const operationMetrics = metrics.filter(m => m.operation === operation);
        
        if (operationMetrics.length === 0) return null;
        
        const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
        return totalDuration / operationMetrics.length;
    }
}

// Test Environment Configuration
class TestEnvironmentConfig {
    static isTestEnvironment() {
        return window.appConfig && window.appConfig.NODE_ENV === 'test';
    }
    
    static isDevelopmentEnvironment() {
        return window.appConfig && window.appConfig.NODE_ENV === 'development';
    }
    
    static getTestConfig() {
        return {
            isTest: this.isTestEnvironment(),
            isDevelopment: this.isDevelopmentEnvironment(),
            disableEmailConfirmation: window.appConfig ? window.appConfig.DISABLE_EMAIL_CONFIRMATION : false,
            hasTestUserManager: typeof window.TestUserManager !== 'undefined',
            hasErrorRecovery: typeof window.ErrorRecoveryManager !== 'undefined',
            hasErrorLogger: typeof window.ErrorLogger !== 'undefined',
            hasPerformanceTracker: typeof window.PerformanceTracker !== 'undefined'
        };
    }
}

// Mock Services for Testing
class MockServices {
    static mockAuth = {
        signIn: async (email, password) => {
            // Mock successful sign in
            return {
                user: { id: 'mock-user-id', email: email },
                session: { access_token: 'mock-token' }
            };
        },
        
        signUp: async (email, password) => {
            // Mock successful sign up
            return {
                user: { id: 'mock-user-id', email: email },
                session: { access_token: 'mock-token' }
            };
        }
    };
    
    static mockDatabase = {
        saveSchedule: async (schedule) => {
            console.log('Mock: Saving schedule', schedule);
            return { success: true, id: 'mock-schedule-id' };
        },
        
        loadSchedule: async () => {
            console.log('Mock: Loading schedule');
            return { success: true, schedule: {} };
        }
    };
}

// Test Data Generator
class TestDataGenerator {
    static generateTestData(type) {
        switch (type) {
            case 'user':
                return {
                    email: `test_${Date.now()}@example.com`,
                    password: 'TestPassword123!',
                    name: 'Test User'
                };
            case 'schedule':
                return {
                    name: 'Test Schedule',
                    subjects: ['Math', 'Science', 'English'],
                    grades: ['9', '10'],
                    days: ['Monday', 'Wednesday', 'Friday'],
                    startTime: '08:00',
                    endTime: '15:00'
                };
            default:
                return {};
        }
    }
}

// Test Cleanup Utilities
class TestCleanup {
    static async cleanupTestData() {
        try {
            // Clear localStorage test data
            const keysToRemove = [
                'errorLogs',
                'authPerformanceMetrics',
                'testUserData',
                'mockData'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clean up any test users
            if (window.TestUserManager) {
                await window.TestUserManager.cleanupTestUsers();
            }
            
            console.log('Test data cleanup completed');
            return { success: true, message: 'Test data cleaned up successfully' };
        } catch (error) {
            console.error('Test cleanup failed:', error);
            throw error;
        }
    }
}

// Session Management and Recovery
class SessionManager {
    static async validateSession() {
        try {
            if (!window.supabaseClient) return false;
            
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            
            return !!session;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }
    
    static async refreshSession() {
        try {
            if (!window.supabaseClient) throw new Error('Supabase not initialized');
            
            const { data, error } = await window.supabaseClient.auth.refreshSession();
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Session refresh failed:', error);
            throw error;
        }
    }
    
    static async recoverSession() {
        try {
            const isValid = await this.validateSession();
            if (isValid) return true;
            
            // Attempt to refresh session
            await this.refreshSession();
            return true;
        } catch (error) {
            console.error('Session recovery failed:', error);
            return false;
        }
    }
}

// Export all classes to global scope for testing
window.TestUserManager = TestUserManager;
window.ErrorRecoveryManager = ErrorRecoveryManager;
window.ErrorLogger = ErrorLogger;
window.PerformanceTracker = PerformanceTracker;
window.TestEnvironmentConfig = TestEnvironmentConfig;
window.MockServices = MockServices;
window.TestDataGenerator = TestDataGenerator;
window.TestCleanup = TestCleanup;
window.SessionManager = SessionManager;

// Export convenience functions
window.logError = ErrorLogger.logError;
window.logAuthEvent = ErrorLogger.logAuthEvent;
window.logPerformance = ErrorLogger.logPerformance;
window.logAuthError = (error, context) => ErrorLogger.logError(error, context);
window.trackError = ErrorLogger.logError;
window.measureAuthTiming = PerformanceTracker.measureAuthTiming;
window.validateSession = SessionManager.validateSession;
window.refreshSession = SessionManager.refreshSession;
window.recoverSession = SessionManager.recoverSession;
window.handleAuthError = ErrorRecoveryManager.handleAuthError;
window.handleRateLimitError = ErrorRecoveryManager.handleRateLimitError;
window.calculateBackoffDelay = ErrorRecoveryManager.calculateBackoffDelay;
window.retryAuthRequest = ErrorRecoveryManager.retryAuthRequest;

// Analytics placeholder
window.analytics = {
    track: (event, data) => {
        console.log('Analytics event:', event, data);
        // In a real implementation, this would send data to analytics service
    }
};

// Test configuration
window.testConfig = TestEnvironmentConfig.getTestConfig();
window.mockServices = MockServices;
window.testDatabase = MockServices.mockDatabase;
window.testHelpers = {
    generateTestData: TestDataGenerator.generateTestData,
    cleanupTestData: TestCleanup.cleanupTestData
};

// Performance metrics storage
window.authMetrics = {
    getMetrics: PerformanceTracker.getPerformanceMetrics,
    getAverage: PerformanceTracker.getAveragePerformance,
    clearMetrics: () => {
        localStorage.removeItem('authPerformanceMetrics');
    }
};

// Auth retry queue
window.authRetryQueue = [];

console.log('✅ Low Priority Refactoring Features Loaded');
console.log('Available classes:', {
    TestUserManager: typeof TestUserManager,
    ErrorRecoveryManager: typeof ErrorRecoveryManager,
    ErrorLogger: typeof ErrorLogger,
    PerformanceTracker: typeof PerformanceTracker,
    TestEnvironmentConfig: typeof TestEnvironmentConfig
});
