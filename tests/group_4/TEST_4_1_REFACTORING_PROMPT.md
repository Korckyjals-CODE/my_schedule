# Test 4.1: Basic Search Functionality - Refactoring Prompt

## Context
Based on the test results from Test 4.1: Basic Search Functionality, the search feature is fundamentally working but has some areas that need improvement. This prompt provides specific guidance for refactoring the search functionality to address identified issues and enhance the overall user experience.

## Test Results Summary
- **Overall Status:** PASS WITH WARNINGS
- **Success Rate:** 57.14% (4/7 tests passed)
- **Main Issues:** Authentication requirements, CSS styling gaps, API integration limitations

## Refactoring Objectives

### 1. Authentication and API Integration Improvements

#### Current Issue
- API endpoints return 401 Unauthorized without proper authentication
- Server-side search functionality cannot be tested or used without authentication
- Limited fallback mechanisms for authentication failures

#### Refactoring Tasks
```javascript
// 1. Improve authentication error handling in search.js
// Current: Basic error handling
// Target: Graceful degradation with user-friendly messages

// Add to search.js around line 425-437
async function performSearch() {
    try {
        // ... existing server-side search code ...
    } catch (error) {
        console.error('Search error:', error);
        
        // Enhanced error handling
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            showSearchError('Authentication required. Please sign in to use advanced search features.');
            // Automatically fall back to client-side search
            console.log('Falling back to client-side search');
            const results = searchSchedule();
            currentSearchResults = results;
            displayResults(results);
        } else {
            // Other error handling
            showSearchError('Search temporarily unavailable. Using offline search.');
            const results = searchSchedule();
            currentSearchResults = results;
            displayResults(results);
        }
    }
}
```

#### Implementation Steps
1. **Enhance Error Handling:** Improve error messages and fallback mechanisms
2. **Authentication Status Check:** Add authentication status validation before API calls
3. **Graceful Degradation:** Ensure client-side search works when server-side fails
4. **User Feedback:** Provide clear feedback about authentication requirements

### 2. CSS Styling Enhancements

#### Current Issue
- Search-specific CSS classes are missing or not properly defined
- Filter styling may not be optimal
- Search interface styling could be improved

#### Refactoring Tasks
```css
/* Add to styles.css - Search-specific styling improvements */

/* Enhanced search input styling */
.search-input {
    width: 100%;
    padding: 15px 20px;
    border: 2px solid #e8f4fd;
    border-radius: 8px;
    font-size: 16px;
    background: #fafbfc;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.search-input:focus {
    outline: none;
    border-color: #3498db;
    background: white;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Enhanced filter styling */
.filter-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    cursor: pointer;
    transition: color 0.2s ease;
    border-radius: 4px;
    padding: 8px 12px;
}

.filter-checkbox:hover {
    color: #3498db;
    background: #f8f9fa;
}

.filter-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #3498db;
}

/* Enhanced result item styling */
.result-item {
    background: #f8f9fa;
    border-left: 4px solid #3498db;
    padding: 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
    margin-bottom: 15px;
}

.result-item:hover {
    background: #e8f4fd;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Search container improvements */
.search-container {
    max-width: 1200px;
    margin: 20px auto;
    padding: 0 15px;
}

.search-filters {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 25px;
    position: sticky;
    top: 20px;
}
```

#### Implementation Steps
1. **Add Missing CSS Classes:** Implement search-specific styling
2. **Enhance Visual Feedback:** Improve hover states and transitions
3. **Responsive Design:** Ensure search interface works on all screen sizes
4. **Accessibility:** Add proper focus states and ARIA labels

### 3. Search Functionality Enhancements

#### Current Issue
- Search functionality is complete but could be more robust
- Error handling could be improved
- User experience could be enhanced

#### Refactoring Tasks
```javascript
// Enhanced search with better error handling and user feedback
async function performSearch() {
    console.log('Performing search with filters:', currentFilters);
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Add to search history
    addToSearchHistory();
    
    // Check if any filters are active
    const hasActiveFilters = currentFilters.searchText || 
                            currentFilters.grades.length > 0 || 
                            currentFilters.subjects.length > 0 || 
                            currentFilters.days.length > 0 || 
                            currentFilters.startTime || 
                            currentFilters.endTime;
    
    try {
        if (!hasActiveFilters) {
            // Show all results when no filters are applied
            hideLoadingIndicator();
            displayAllResults();
        } else {
            // Check authentication status first
            const isAuthenticated = await checkAuthenticationStatus();
            
            if (isAuthenticated) {
                // Use server-side search API
                await performServerSideSearch();
            } else {
                // Use client-side search with notification
                showSearchNotification('Using offline search. Sign in for advanced features.');
                const results = searchSchedule();
                currentSearchResults = results;
                displayResults(results);
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        hideLoadingIndicator();
        
        // Fallback to client-side search
        console.log('Falling back to client-side search');
        const results = searchSchedule();
        currentSearchResults = results;
        displayResults(results);
        
        // Show error message
        showSearchError('Server search failed. Using offline search.');
    }
}

// Add authentication status check
async function checkAuthenticationStatus() {
    try {
        const user = supabaseAuth.getCurrentUser();
        return user !== null;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Enhanced server-side search
async function performServerSideSearch() {
    const searchParams = {
        searchText: currentFilters.searchText,
        grades: currentFilters.grades,
        subjects: currentFilters.subjects,
        days: currentFilters.days,
        startTime: currentFilters.startTime,
        endTime: currentFilters.endTime,
        page: 1,
        limit: 100
    };
    
    const headers = supabaseAuth.getAuthHeaders();
    const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
    });
    
    if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Server search results:', data);
    
    currentSearchResults = data.results;
    displayResults(data.results, data.totalCount, data.page, data.totalPages);
}

// Add user notification system
function showSearchNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'search-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
        border-radius: 6px;
        padding: 15px 20px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 300px;
        font-size: 14px;
    `;
    
    notification.innerHTML = `
        ℹ️ ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}
```

#### Implementation Steps
1. **Authentication Integration:** Add proper authentication status checking
2. **Enhanced Error Handling:** Improve error messages and fallback mechanisms
3. **User Notifications:** Add informative notifications for different states
4. **Performance Optimization:** Optimize search performance and loading states

### 4. Testing Infrastructure Improvements

#### Current Issue
- Tests fail due to authentication requirements
- Limited test coverage for API functionality
- Need better test authentication setup

#### Refactoring Tasks
```javascript
// Add test authentication helper
class TestAuthenticationHelper {
    static async setupTestAuth() {
        // Create or use test user
        const testUser = {
            email: 'testuser@example.com',
            password: 'testpassword123'
        };
        
        try {
            // Try to sign in with test user
            await supabaseAuth.signIn(testUser.email, testUser.password);
            return true;
        } catch (error) {
            // If user doesn't exist, create it
            try {
                await supabaseAuth.signUp(testUser.email, testUser.password);
                return true;
            } catch (signupError) {
                console.error('Failed to create test user:', signupError);
                return false;
            }
        }
    }
    
    static async cleanupTestAuth() {
        try {
            await supabaseAuth.signOut();
        } catch (error) {
            console.error('Failed to cleanup test auth:', error);
        }
    }
}

// Enhanced test with authentication
async function runSearchTestsWithAuth() {
    const authSetup = await TestAuthenticationHelper.setupTestAuth();
    
    if (!authSetup) {
        console.warn('Test authentication setup failed, running limited tests');
        return runLimitedSearchTests();
    }
    
    try {
        // Run full test suite with authentication
        await testServerSideSearch();
        await testSearchAPIEndpoints();
        await testSearchWithFilters();
        // ... other authenticated tests
    } finally {
        await TestAuthenticationHelper.cleanupTestAuth();
    }
}
```

#### Implementation Steps
1. **Test Authentication:** Implement test user authentication
2. **API Testing:** Enable comprehensive API endpoint testing
3. **Test Coverage:** Expand test coverage with authentication
4. **Test Cleanup:** Ensure proper test cleanup and isolation

## Implementation Priority

### High Priority (Immediate)
1. **CSS Styling:** Add missing search-specific CSS classes
2. **Error Handling:** Improve authentication error handling
3. **User Feedback:** Add clear user notifications

### Medium Priority (Next Sprint)
1. **Authentication Integration:** Enhance authentication status checking
2. **Performance Optimization:** Optimize search performance
3. **Accessibility:** Improve accessibility features

### Low Priority (Future)
1. **Testing Infrastructure:** Implement comprehensive test authentication
2. **Advanced Features:** Add advanced search features
3. **Analytics:** Add search analytics and usage tracking

## Success Criteria

### Functional Requirements
- ✅ Search functionality works with and without authentication
- ✅ Graceful fallback to client-side search when server-side fails
- ✅ Clear user feedback for all search states
- ✅ Proper error handling and recovery

### Non-Functional Requirements
- ✅ Search interface is visually appealing and consistent
- ✅ Search performance is acceptable (< 2 seconds)
- ✅ Search works on all supported browsers and devices
- ✅ Search is accessible to users with disabilities

### Testing Requirements
- ✅ All search tests pass with proper authentication
- ✅ Search functionality is thoroughly tested
- ✅ Error scenarios are properly handled and tested
- ✅ User experience is validated through testing

## Conclusion

The search functionality is fundamentally sound but requires these refactoring improvements to provide a robust, user-friendly experience. The main focus should be on authentication handling, CSS styling, and enhanced error management. With these improvements, the search feature will provide excellent functionality for users while maintaining reliability and performance.

## Files to Modify
1. `public/js/search.js` - Enhanced error handling and authentication
2. `public/css/styles.css` - Search-specific styling improvements
3. `tests/group_4/test_4_1_simple_search.js` - Enhanced test with authentication
4. `public/search.html` - Accessibility improvements (if needed)

## Estimated Effort
- **CSS Styling:** 2-4 hours
- **Error Handling:** 4-6 hours
- **Authentication Integration:** 6-8 hours
- **Testing Infrastructure:** 4-6 hours
- **Total:** 16-24 hours
