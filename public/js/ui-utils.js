// UI Utility Functions for Error Handling and Loading States

// Error message mapping for user-friendly messages
const ERROR_MESSAGES = {
    'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
    'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
    'Too many requests': 'Too many login attempts. Please wait a moment before trying again.',
    'User not found': 'No account found with this email address. Please check your email or sign up.',
    'Invalid email': 'Please enter a valid email address.',
    'Email address "test@example.com" is invalid': 'The email "test@example.com" is not allowed. Please use a different email address like "yourname@gmail.com" or "test@yourdomain.com".',
    'Password is too weak': 'Password must be at least 6 characters long.',
    'User already registered': 'An account with this email already exists. Please sign in instead.',
    'Signup is disabled': 'New account registration is currently disabled.',
    'Invalid password': 'The password you entered is incorrect.',
    'Email rate limit exceeded': 'Too many emails sent. Please wait before requesting another.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Signup requires a valid password': 'Please enter a valid password.',
    'For security purposes, you can only request this once every 60 seconds': 'Please wait 60 seconds before requesting another password reset.',
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
    'NetworkError when attempting to fetch resource': 'Network error. Please check your internet connection and try again.',
    'TypeError: Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
    'ERR_NETWORK': 'Network error. Please check your internet connection and try again.',
    'ERR_INTERNET_DISCONNECTED': 'No internet connection. Please check your network and try again.',
    'ERR_CONNECTION_REFUSED': 'Unable to connect to the server. Please check your internet connection and try again.',
    'ERR_TIMED_OUT': 'Connection timed out. Please check your internet connection and try again.',
    'Supabase not initialized': 'Unable to connect to the authentication service. Please check your internet connection and try again.',
    'Cannot read properties of undefined (reading \'createClient\')': 'Unable to load authentication service. Please check your internet connection and try again.',
    'Failed to initialize Supabase': 'Unable to connect to the authentication service. Please check your internet connection and try again.'
};

// Get user-friendly error message
function getErrorMessage(error) {
    const message = error.message || error.toString();
    
    // Check for exact matches first
    if (ERROR_MESSAGES[message]) {
        return ERROR_MESSAGES[message];
    }
    
    // Check for network-related error patterns
    if (message.includes('Failed to fetch') || 
        message.includes('NetworkError') || 
        message.includes('ERR_NETWORK') ||
        message.includes('ERR_INTERNET_DISCONNECTED') ||
        message.includes('ERR_CONNECTION_REFUSED') ||
        message.includes('ERR_TIMED_OUT') ||
        message.includes('TypeError: Failed to fetch') ||
        message.includes('fetch') ||
        message.includes('Supabase not initialized') ||
        message.includes('Cannot read properties of undefined') ||
        message.includes('Failed to initialize Supabase')) {
        return 'Unable to connect to the authentication service. Please check your internet connection and try again.';
    }
    
    // Check for authentication errors
    if (message.includes('Invalid login credentials') || 
        message.includes('Invalid password') ||
        message.includes('User not found')) {
        return 'The email or password you entered is incorrect. Please try again.';
    }
    
    // Check for email validation errors
    if (message.includes('Email') && message.includes('invalid')) {
        return 'Please enter a valid email address.';
    }
    
    // Check for password strength errors
    if (message.includes('Password') && (message.includes('weak') || message.includes('6 characters'))) {
        return 'Password must be at least 6 characters long.';
    }
    
    // Default fallback
    return 'An unexpected error occurred. Please try again.';
}

// Show error message with proper UI component
function showErrorMessage(message, duration = 5000) {
    // Remove any existing error messages
    removeExistingMessages('error-message');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" title="Close">×</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, duration);
}

// Show success message with proper UI component
function showSuccessMessage(message, duration = 3000) {
    // Remove any existing success messages
    removeExistingMessages('success-message');
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" title="Close">×</button>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, duration);
}

// Remove existing messages of a specific type
function removeExistingMessages(className) {
    const existingMessages = document.querySelectorAll(`.${className}`);
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
}

// Show field error for form validation
function showFieldError(field, message) {
    // Remove existing field error
    clearFieldError(field);
    
    // Add error class to field
    field.classList.add('field-error');
    
    // Create error message element
    const errorMessage = document.createElement('span');
    errorMessage.className = 'field-error-message';
    errorMessage.textContent = message;
    
    // Insert after the field
    field.parentNode.insertBefore(errorMessage, field.nextSibling);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('field-error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Set loading state for a button
function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('btn-loading');
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    } else {
        button.disabled = false;
        button.classList.remove('btn-loading');
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// Set loading state for form inputs
function setFormLoading(form, isLoading) {
    const inputs = form.querySelectorAll('input, button, select');
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
    
    if (isLoading) {
        form.classList.add('loading');
    } else {
        form.classList.remove('loading');
    }
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    return password && password.length >= 6;
}

// Setup real-time form validation
function setupFormValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            console.log('Email blur event triggered for:', this.value);
            if (this.value && !validateEmail(this.value)) {
                console.log('Email validation failed, showing error');
                showFieldError(this, 'Please enter a valid email address');
            } else {
                console.log('Email validation passed, clearing error');
                clearFieldError(this);
            }
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('field-error') && validateEmail(this.value)) {
                clearFieldError(this);
            }
        });
        
        // Also trigger validation on focus loss (more reliable)
        input.addEventListener('focusout', function() {
            console.log('Email focusout event triggered for:', this.value);
            if (this.value && !validateEmail(this.value)) {
                console.log('Email validation failed on focusout, showing error');
                showFieldError(this, 'Please enter a valid email address');
            } else {
                console.log('Email validation passed on focusout, clearing error');
                clearFieldError(this);
            }
        });
    });
    
    passwordInputs.forEach(input => {
        input.addEventListener('blur', function() {
            console.log('Password blur event triggered for:', this.value);
            if (this.value && !validatePassword(this.value)) {
                console.log('Password validation failed, showing error');
                showFieldError(this, 'Password must be at least 6 characters long');
            } else {
                console.log('Password validation passed, clearing error');
                clearFieldError(this);
            }
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('field-error') && validatePassword(this.value)) {
                clearFieldError(this);
            }
        });
        
        // Also trigger validation on focus loss (more reliable)
        input.addEventListener('focusout', function() {
            console.log('Password focusout event triggered for:', this.value);
            if (this.value && !validatePassword(this.value)) {
                console.log('Password validation failed on focusout, showing error');
                showFieldError(this, 'Password must be at least 6 characters long');
            } else {
                console.log('Password validation passed on focusout, clearing error');
                clearFieldError(this);
            }
        });
    });
}

// Enhanced error handling wrapper for async functions
async function handleAsyncOperation(operation, errorContext = 'Operation') {
    try {
        return await operation();
    } catch (error) {
        console.error(`${errorContext} failed:`, error);
        const userMessage = getErrorMessage(error);
        showErrorMessage(userMessage);
        throw error; // Re-throw for caller to handle if needed
    }
}

// Export functions for global use
window.UIUtils = {
    showErrorMessage,
    showSuccessMessage,
    showFieldError,
    clearFieldError,
    setButtonLoading,
    setFormLoading,
    validateEmail,
    validatePassword,
    setupFormValidation,
    handleAsyncOperation,
    getErrorMessage
};
