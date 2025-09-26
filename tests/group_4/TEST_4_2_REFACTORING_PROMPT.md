# Test 4.2: Advanced Filtering - Refactoring Prompt

## Context
Based on Test 4.2 execution results, the advanced filtering functionality in the search interface has significant issues that prevent it from working properly. The test identified that while the UI structure is correct, the core filtering functionality is broken due to missing filter checkboxes.

## Issues Identified

### Critical Issues
1. **Missing Filter Checkboxes:** No checkboxes are being populated in any filter section
   - Grade filters: 0 checkboxes (expected ~30)
   - Subject filters: 0 checkboxes (expected ~15)  
   - Day filters: 0 checkboxes (expected 5)

2. **JavaScript Initialization Failure:** The filter population functions are not executing properly

3. **Interface Visibility Issues:** App section visibility problems detected

## Refactoring Requirements

### 1. Fix Filter Checkbox Population

**Problem:** The `populateGradeFilters()`, `populateSubjectFilters()`, and `populateDayFilters()` functions are not creating the expected checkboxes.

**Required Actions:**
- Debug the filter population functions in `public/js/search.js`
- Ensure the functions are called during `initializeSearchInterface()`
- Verify that the DOM elements exist before attempting to populate them
- Add error handling and logging to track initialization progress

**Code Location:** `public/js/search.js` lines 190-236

**Expected Fix:**
```javascript
// Ensure these functions are called and working properly
function populateGradeFilters() {
    const gradeContainer = document.getElementById('gradeFilters');
    if (!gradeContainer) {
        console.error('Grade filters container not found');
        return;
    }
    
    gradeContainer.innerHTML = '';
    
    AVAILABLE_GRADES.forEach(grade => {
        const checkbox = document.createElement('div');
        checkbox.className = 'filter-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="grade-${grade}" value="${grade}">
            <label for="grade-${grade}">${grade}</label>
        `;
        gradeContainer.appendChild(checkbox);
    });
    
    console.log(`Populated ${AVAILABLE_GRADES.length} grade filters`);
}
```

### 2. Fix Interface Initialization

**Problem:** The search interface is not properly initializing, causing visibility issues.

**Required Actions:**
- Review the `initializeSearchInterface()` function
- Ensure proper timing of function calls
- Add checks to verify all required elements exist
- Implement proper error handling for missing elements

**Code Location:** `public/js/search.js` lines 155-171

**Expected Fix:**
```javascript
function initializeSearchInterface() {
    try {
        // Verify required elements exist
        const requiredElements = [
            'gradeFilters',
            'subjectFilters', 
            'dayFilters',
            'startTime',
            'endTime'
        ];
        
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                console.error(`Required element not found: ${elementId}`);
                return;
            }
        }
        
        // Populate filters
        populateGradeFilters();
        populateSubjectFilters();
        populateDayFilters();
        populateSavedSearches();
        populateSearchHistory();
        setupEventListeners();
        
        // Check for URL parameters
        handleUrlParameters();
        
        // Show all results initially
        setTimeout(() => {
            displayAllResults();
        }, 100);
        
        console.log('Search interface initialized successfully');
    } catch (error) {
        console.error('Error initializing search interface:', error);
    }
}
```

### 3. Fix Event Listener Setup

**Problem:** Event listeners may not be properly attached to filter elements.

**Required Actions:**
- Review the `setupEventListeners()` function
- Ensure event listeners are attached after elements are created
- Add proper error handling for missing elements
- Verify that filter change events trigger search updates

**Code Location:** `public/js/search.js` lines 266-309

**Expected Fix:**
```javascript
function setupEventListeners() {
    try {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.searchText = e.target.value.toLowerCase();
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(() => {
                    performSearch();
                }, 300);
            });
        }
        
        // Grade filters
        document.querySelectorAll('#gradeFilters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateGradeFilters);
        });
        
        // Subject filters
        document.querySelectorAll('#subjectFilters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateSubjectFilters);
        });
        
        // Day filters
        document.querySelectorAll('#dayFilters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateDayFilters);
        });
        
        // Time filters
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        if (startTime) startTime.addEventListener('change', updateTimeFilters);
        if (endTime) endTime.addEventListener('change', updateTimeFilters);
        
        // Action buttons
        const clearBtn = document.getElementById('clearFiltersBtn');
        const searchBtn = document.getElementById('searchBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
        if (searchBtn) searchBtn.addEventListener('click', performSearch);
        if (exportBtn) exportBtn.addEventListener('click', toggleExportOptions);
        
        console.log('Event listeners setup completed');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}
```

### 4. Add Debug Logging

**Problem:** Insufficient logging makes it difficult to diagnose initialization issues.

**Required Actions:**
- Add comprehensive logging throughout the initialization process
- Log when each filter type is populated
- Log when event listeners are attached
- Log any errors or missing elements

**Implementation:**
```javascript
// Add logging to track initialization progress
console.log('Starting search interface initialization...');
console.log('Available grades:', AVAILABLE_GRADES.length);
console.log('Available subjects:', AVAILABLE_SUBJECTS.length);
console.log('Available days:', AVAILABLE_DAYS.length);
```

### 5. Fix Data Loading Dependencies

**Problem:** Filter initialization may be happening before schedule data is loaded.

**Required Actions:**
- Ensure `initializeSearchInterface()` is called after `loadSchedule()` completes
- Add proper sequencing of initialization steps
- Verify that schedule data is available before populating filters

**Code Location:** `public/js/search.js` lines 125-153

**Expected Fix:**
```javascript
async function loadSchedule() {
    try {
        const headers = supabaseAuth.getAuthHeaders();
        const response = await fetch('/api/schedule', {
            headers: headers
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showAuth();
                return;
            }
            throw new Error('Failed to load schedule');
        }
        
        const data = await response.json();
        schedule = data;
        console.log('Schedule loaded for search:', schedule);
        
        // Initialize search interface AFTER data is loaded
        initializeSearchInterface();
    } catch (error) {
        console.error('Error loading schedule:', error);
        if (error.message.includes('No authentication token')) {
            showAuth();
        }
    }
}
```

## Testing Requirements

After implementing the fixes, the following tests should be performed:

### 1. Filter Population Test
- Verify that all grade checkboxes are created (should be ~30)
- Verify that all subject checkboxes are created (should be ~15)
- Verify that all day checkboxes are created (should be 5)
- Verify that checkboxes have proper labels and values

### 2. Filter Functionality Test
- Test individual grade filter selection
- Test individual subject filter selection
- Test individual day filter selection
- Test time range filtering
- Test combined filter selection
- Test clear filters functionality

### 3. Search Results Test
- Verify that filtered searches return appropriate results
- Verify that result counts are accurate
- Verify that no results are shown when appropriate
- Verify that search results are properly formatted

### 4. Saved Searches Test
- Test saving current filter combinations
- Test loading saved searches
- Test deleting saved searches
- Verify that saved searches persist across sessions

## Success Criteria

The refactoring is successful when:
1. All filter checkboxes are properly populated and visible
2. Filter selection triggers search updates
3. Combined filters work correctly
4. Clear filters resets all selections
5. Saved searches functionality works end-to-end
6. No JavaScript errors in browser console
7. All test cases from Test 4.2 pass

## Files to Modify

1. **`public/js/search.js`** - Main file requiring fixes
   - Lines 155-171: `initializeSearchInterface()` function
   - Lines 190-236: Filter population functions
   - Lines 266-309: Event listener setup
   - Lines 125-153: Schedule loading and initialization

2. **`public/search.html`** - Verify HTML structure is correct
   - Ensure all required container elements exist
   - Verify element IDs match JavaScript selectors

## Priority

**HIGH PRIORITY** - This is a core functionality issue that prevents users from using the advanced filtering features. The search interface is essentially non-functional without these fixes.

## Additional Notes

- The UI structure and styling appear to be correct
- The issue is primarily in the JavaScript initialization logic
- Consider adding a loading indicator while filters are being populated
- Consider implementing fallback behavior if filter population fails
- Add unit tests for the filter population functions to prevent regression
