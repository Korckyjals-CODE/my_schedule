// Search Page JavaScript
let schedule = {
    weekdays: {},
    specific_dates: {}
};

let searchResults = [];
let currentFilters = {
    searchText: '',
    grades: [],
    subjects: [],
    days: [],
    startTime: '',
    endTime: ''
};

// Saved searches and search history
let savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
let currentSearchResults = [];

// Available options for filters
const AVAILABLE_GRADES = [
    'PKA', 'PKB', 'KA', 'KB', 'PA', 'PB',
    '1A', '1B', '2A', '2B', '3A', '3B',
    '4A', '4B', '5A', '5B', '6A', '6B',
    '7A', '8A', '9A', '10A', '11A', '12A',
    'DC1A', 'DC1B', 'DC2A', 'DC2B', 'DC3A', 'DC3B',
    'DC1', 'DC2', 'DC3'
];

const AVAILABLE_SUBJECTS = [
    'Class', 'Recess', 'Lunch', 'Assembly', 'Form Period',
    'Holiday', 'Dismissal', 'Field Trip', 'Morning Door',
    'Morning Duty', 'Recess Duty', 'Lunch Duty', 'Dismissal Duty',
    'Dismissal Door', 'Prep', 'Other'
];

const AVAILABLE_DAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

// Authentication functions (reused from script.js)
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignUp() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

async function handleLogin() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await supabaseAuth.signIn(email, password);
        showApp();
        loadSchedule();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleSignUp() {
    try {
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        await supabaseAuth.signUp(email, password);
        alert('Account created! Please check your email to confirm your account, then sign in.');
        showLogin();
    } catch (error) {
        alert('Sign up failed: ' + error.message);
    }
}

async function handleSignOut() {
    try {
        await supabaseAuth.signOut();
        showAuth();
    } catch (error) {
        alert('Sign out failed: ' + error.message);
    }
}

function showAuth() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('appSection').style.display = 'none';
}

function showApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    
    // Update user info
    const user = supabaseAuth.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    // Initialize search interface
    initializeSearchInterface();
}

// Initialize the search page
async function initApp() {
    try {
        const isAuthenticated = await supabaseAuth.checkAuth();
        if (isAuthenticated) {
            showApp();
            loadSchedule();
        } else {
            showAuth();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showAuth();
    }
}

// Load schedule data with authentication
async function loadSchedule() {
    try {
        const headers = supabaseAuth.getAuthHeaders();
        const response = await fetch('/api/schedule', {
            headers: headers
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, redirect to auth
                showAuth();
                return;
            }
            throw new Error('Failed to load schedule');
        }
        
        const data = await response.json();
        schedule = data;
        console.log('Schedule loaded for search:', schedule);
        
        // Initialize search interface after data is loaded
        initializeSearchInterface();
    } catch (error) {
        console.error('Error loading schedule:', error);
        if (error.message.includes('No authentication token')) {
            showAuth();
        }
    }
}

// Initialize the search interface
function initializeSearchInterface() {
    populateGradeFilters();
    populateSubjectFilters();
    populateDayFilters();
    populateSavedSearches();
    populateSearchHistory();
    setupEventListeners();
    
    // Check for URL parameters (from quick search)
    handleUrlParameters();
    
    // Show all results initially
    setTimeout(() => {
        displayAllResults();
    }, 100);
}

// Handle URL parameters for quick search
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        // Set the search input with the query
        document.getElementById('searchInput').value = query;
        currentFilters.searchText = query.toLowerCase();
        
        // Perform search automatically
        setTimeout(() => {
            performSearch();
        }, 200);
    }
}

// Populate grade filter checkboxes
function populateGradeFilters() {
    const gradeContainer = document.getElementById('gradeFilters');
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
}

// Populate subject filter checkboxes
function populateSubjectFilters() {
    const subjectContainer = document.getElementById('subjectFilters');
    subjectContainer.innerHTML = '';
    
    AVAILABLE_SUBJECTS.forEach(subject => {
        const checkbox = document.createElement('div');
        checkbox.className = 'filter-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="subject-${subject}" value="${subject}">
            <label for="subject-${subject}">${subject}</label>
        `;
        subjectContainer.appendChild(checkbox);
    });
}

// Populate day filter checkboxes
function populateDayFilters() {
    const dayContainer = document.getElementById('dayFilters');
    dayContainer.innerHTML = '';
    
    AVAILABLE_DAYS.forEach(day => {
        const checkbox = document.createElement('div');
        checkbox.className = 'filter-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="day-${day}" value="${day}">
            <label for="day-${day}">${day}</label>
        `;
        dayContainer.appendChild(checkbox);
    });
}

// Populate saved searches dropdown
function populateSavedSearches() {
    const select = document.getElementById('savedSearchesSelect');
    select.innerHTML = '<option value="">Select a saved search...</option>';
    
    savedSearches.forEach((search, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = search.name;
        select.appendChild(option);
    });
}

// Populate search history dropdown
function populateSearchHistory() {
    const select = document.getElementById('searchHistorySelect');
    select.innerHTML = '<option value="">Select from recent searches...</option>';
    
    // Show last 10 searches
    const recentSearches = searchHistory.slice(-10).reverse();
    recentSearches.forEach((search, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${search.name} (${new Date(search.timestamp).toLocaleDateString()})`;
        select.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        currentFilters.searchText = e.target.value.toLowerCase();
        // Auto-search as user types (debounced)
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            performSearch();
        }, 300);
    });
    
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
    document.getElementById('startTime').addEventListener('change', updateTimeFilters);
    document.getElementById('endTime').addEventListener('change', updateTimeFilters);
    
    // Saved searches
    document.getElementById('savedSearchesSelect').addEventListener('change', loadSavedSearch);
    document.getElementById('saveCurrentBtn').addEventListener('click', saveCurrentSearch);
    document.getElementById('deleteSavedBtn').addEventListener('click', deleteSavedSearch);
    
    // Search history
    document.getElementById('searchHistorySelect').addEventListener('change', loadSearchHistory);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearSearchHistory);
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', toggleExportOptions);
}

// Update grade filters
function updateGradeFilters() {
    currentFilters.grades = Array.from(document.querySelectorAll('#gradeFilters input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    performSearch();
}

// Update subject filters
function updateSubjectFilters() {
    currentFilters.subjects = Array.from(document.querySelectorAll('#subjectFilters input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    performSearch();
}

// Update day filters
function updateDayFilters() {
    currentFilters.days = Array.from(document.querySelectorAll('#dayFilters input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    performSearch();
}

// Update time filters
function updateTimeFilters() {
    currentFilters.startTime = document.getElementById('startTime').value;
    currentFilters.endTime = document.getElementById('endTime').value;
    performSearch();
}

// Clear all filters
function clearAllFilters() {
    // Clear search input
    document.getElementById('searchInput').value = '';
    currentFilters.searchText = '';
    
    // Clear all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear time inputs
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    
    // Reset filter state
    currentFilters = {
        searchText: '',
        grades: [],
        subjects: [],
        days: [],
        startTime: '',
        endTime: ''
    };
    
    // Clear results
    displayResults([]);
}

// Perform search
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
            // Use server-side search API
            const searchParams = {
                searchText: currentFilters.searchText,
                grades: currentFilters.grades,
                subjects: currentFilters.subjects,
                days: currentFilters.days,
                startTime: currentFilters.startTime,
                endTime: currentFilters.endTime,
                page: 1,
                limit: 100 // Get more results for better UX
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

// Display all schedule entries when no filters are applied
function displayAllResults() {
    const results = [];
    
    // Get all weekday events
    Object.entries(schedule.weekdays).forEach(([day, events]) => {
        if (events && Array.isArray(events)) {
            events.forEach((event, index) => {
                results.push({
                    ...event,
                    day: day,
                    date: null,
                    type: 'weekday',
                    index: index,
                    source: 'weekday'
                });
            });
        }
    });
    
    // Get all specific date events
    Object.entries(schedule.specific_dates).forEach(([date, events]) => {
        if (events && Array.isArray(events)) {
            events.forEach((event, index) => {
                const day = getWeekDay(new Date(date));
                results.push({
                    ...event,
                    day: day,
                    date: date,
                    type: 'specific',
                    index: index,
                    source: 'specific_date'
                });
            });
        }
    });
    
    console.log('📋 Showing all', results.length, 'schedule entries');
    displayResults(results);
}

// Search through schedule data
function searchSchedule() {
    const results = [];
    
    console.log('🔍 Starting search with filters:', currentFilters);
    console.log('📅 Schedule data:', schedule);
    
    // Search through weekdays
    Object.entries(schedule.weekdays).forEach(([day, events]) => {
        if (events && Array.isArray(events)) {
            events.forEach((event, index) => {
                if (matchesFilters(event, day, null)) {
                    results.push({
                        ...event,
                        day: day,
                        date: null,
                        type: 'weekday',
                        index: index,
                        source: 'weekday'
                    });
                }
            });
        }
    });
    
    // Search through specific dates
    Object.entries(schedule.specific_dates).forEach(([date, events]) => {
        if (events && Array.isArray(events)) {
            events.forEach((event, index) => {
                const day = getWeekDay(new Date(date));
                if (matchesFilters(event, day, date)) {
                    results.push({
                        ...event,
                        day: day,
                        date: date,
                        type: 'specific',
                        index: index,
                        source: 'specific_date'
                    });
                }
            });
        }
    });
    
    console.log('✅ Search completed. Found', results.length, 'results');
    return results;
}

// Check if event matches current filters
function matchesFilters(event, day, date) {
    console.log('🔍 Checking event:', event, 'for day:', day);
    
    // Text search - more comprehensive
    if (currentFilters.searchText) {
        const searchText = currentFilters.searchText.toLowerCase().trim();
        if (searchText) {
            const eventText = `${event.grade || ''} ${event.subject || ''} ${event.startTime || ''} ${event.endTime || ''} ${day || ''}`.toLowerCase();
            if (!eventText.includes(searchText)) {
                console.log('❌ Text search failed for:', eventText, 'searching for:', searchText);
                return false;
            }
        }
    }
    
    // Grade filter - handle empty grades
    if (currentFilters.grades.length > 0) {
        const eventGrade = event.grade || '';
        if (!currentFilters.grades.includes(eventGrade)) {
            console.log('❌ Grade filter failed for:', eventGrade, 'allowed:', currentFilters.grades);
            return false;
        }
    }
    
    // Subject filter
    if (currentFilters.subjects.length > 0) {
        const eventSubject = event.subject || '';
        if (!currentFilters.subjects.includes(eventSubject)) {
            console.log('❌ Subject filter failed for:', eventSubject, 'allowed:', currentFilters.subjects);
            return false;
        }
    }
    
    // Day filter
    if (currentFilters.days.length > 0) {
        if (!currentFilters.days.includes(day)) {
            console.log('❌ Day filter failed for:', day, 'allowed:', currentFilters.days);
            return false;
        }
    }
    
    // Time filter - improved logic
    if (currentFilters.startTime || currentFilters.endTime) {
        const eventStart = convertTimeToMinutes(event.startTime);
        const eventEnd = convertTimeToMinutes(event.endTime);
        
        if (currentFilters.startTime) {
            const filterStart = convertTimeToMinutes(currentFilters.startTime);
            // Event should start after or at the filter start time
            if (eventStart < filterStart) {
                console.log('❌ Start time filter failed:', eventStart, 'vs', filterStart);
                return false;
            }
        }
        
        if (currentFilters.endTime) {
            const filterEnd = convertTimeToMinutes(currentFilters.endTime);
            // Event should end before or at the filter end time
            if (eventEnd > filterEnd) {
                console.log('❌ End time filter failed:', eventEnd, 'vs', filterEnd);
                return false;
            }
        }
    }
    
    console.log('✅ Event matches all filters');
    return true;
}

// Convert time string to minutes for comparison
function convertTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Display search results
function displayResults(results, totalCount = null, page = 1, totalPages = 1) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    console.log('📊 Displaying', results.length, 'results', totalCount ? `(total: ${totalCount})` : '');
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Update results count
    if (results.length === 0) {
        resultsCount.textContent = 'No results found';
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h4>🔍 No Results Found</h4>
                <p>Try adjusting your search terms or filters</p>
                <div style="margin-top: 15px; font-size: 14px; color: #95a5a6;">
                    <p><strong>Search Tips:</strong></p>
                    <ul style="text-align: left; margin: 10px 0;">
                        <li>Try searching for grade names like "11A" or "6A"</li>
                        <li>Search for subjects like "Class", "Recess", or "Lunch"</li>
                        <li>Use time ranges like "7:45" or "8:30"</li>
                        <li>Select specific days or grades from the filters</li>
                    </ul>
                </div>
            </div>
        `;
    } else {
        const hasActiveFilters = currentFilters.searchText || 
                                currentFilters.grades.length > 0 || 
                                currentFilters.subjects.length > 0 || 
                                currentFilters.days.length > 0 || 
                                currentFilters.startTime || 
                                currentFilters.endTime;
        
        if (hasActiveFilters) {
            const countText = totalCount ? `${results.length} of ${totalCount}` : results.length;
            resultsCount.textContent = `${countText} result${totalCount ? 's' : (results.length === 1 ? '' : 's')} found`;
            
            // Show pagination info if applicable
            if (totalPages > 1) {
                resultsCount.textContent += ` (Page ${page} of ${totalPages})`;
            }
        } else {
            resultsCount.textContent = `Showing all ${results.length} schedule entries`;
        }
        
        // Sort results by day and time
        const sortedResults = results.sort((a, b) => {
            const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const aDayIndex = dayOrder.indexOf(a.day);
            const bDayIndex = dayOrder.indexOf(b.day);
            
            if (aDayIndex !== bDayIndex) {
                return aDayIndex - bDayIndex;
            }
            
            // If same day, sort by start time
            return convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
        });
        
        // Create results list
        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';
        
        sortedResults.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Determine if this is a class or non-class event
            const isClass = result.subject === 'Class' && result.grade;
            const gradeDisplay = result.grade || 'No Grade';
            const subjectDisplay = result.subject || 'Unknown Subject';
            
            resultItem.innerHTML = `
                <div class="result-content">
                    <div class="result-header">
                        <div class="result-grade">${gradeDisplay}</div>
                        <div class="result-day">${result.day}</div>
                    </div>
                    <div class="result-subject">${subjectDisplay}</div>
                    <div class="result-time">${result.startTime} - ${result.endTime}</div>
                    ${result.date ? `<div class="result-date" style="font-size: 12px; color: #95a5a6; margin-top: 5px;">📅 Specific Date: ${result.date}</div>` : ''}
                    <div class="result-source" style="font-size: 11px; color: #bdc3c7; margin-top: 5px;">
                        ${result.source === 'weekday' ? '📅 Weekly Schedule' : '📆 Specific Date Schedule'}
                    </div>
                </div>
                <div class="hover-buttons">
                    <button class="edit-btn" onclick="editEventFromSearch('${result.date || ''}', '${result.day}', ${result.index})" title="Edit Event">✏️</button>
                    <button class="delete-btn" onclick="deleteEventFromSearch('${result.date || ''}', '${result.day}', ${result.index})" title="Delete Event">🗑️</button>
                </div>
            `;
            
            // Add click handler to navigate to calendar and highlight this event
            resultItem.style.cursor = 'pointer';
            resultItem.addEventListener('click', () => {
                console.log('Clicked result:', result);
                navigateToCalendarWithHighlight(result);
            });
            
            resultsList.appendChild(resultItem);
        });
        
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(resultsList);
    }
}

// Get weekday name from date
function getWeekDay(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Loading indicator functions
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('searchTips').style.display = 'none';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('searchTips').style.display = 'block';
}

function showSearchError(message) {
    const resultsContainer = document.getElementById('resultsContainer');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'search-error';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <strong>⚠️ Search Notice</strong><br>
        ${message}
    `;
    
    // Insert error message at the top of results
    resultsContainer.insertBefore(errorDiv, resultsContainer.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Search history functions
function addToSearchHistory() {
    const hasActiveFilters = currentFilters.searchText || 
                            currentFilters.grades.length > 0 || 
                            currentFilters.subjects.length > 0 || 
                            currentFilters.days.length > 0 || 
                            currentFilters.startTime || 
                            currentFilters.endTime;
    
    if (hasActiveFilters) {
        const searchName = generateSearchName();
        const searchEntry = {
            name: searchName,
            filters: { ...currentFilters },
            timestamp: Date.now()
        };
        
        // Remove duplicate if exists
        searchHistory = searchHistory.filter(s => 
            JSON.stringify(s.filters) !== JSON.stringify(currentFilters)
        );
        
        // Add to history
        searchHistory.push(searchEntry);
        
        // Keep only last 20 searches
        if (searchHistory.length > 20) {
            searchHistory = searchHistory.slice(-20);
        }
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        
        // Update UI
        populateSearchHistory();
    }
}

function generateSearchName() {
    const parts = [];
    
    if (currentFilters.searchText) {
        parts.push(`"${currentFilters.searchText}"`);
    }
    
    if (currentFilters.grades.length > 0) {
        parts.push(`Grades: ${currentFilters.grades.join(', ')}`);
    }
    
    if (currentFilters.subjects.length > 0) {
        parts.push(`Subjects: ${currentFilters.subjects.join(', ')}`);
    }
    
    if (currentFilters.days.length > 0) {
        parts.push(`Days: ${currentFilters.days.join(', ')}`);
    }
    
    if (currentFilters.startTime || currentFilters.endTime) {
        const timeRange = `${currentFilters.startTime || '00:00'} - ${currentFilters.endTime || '23:59'}`;
        parts.push(`Time: ${timeRange}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Custom Search';
}

function loadSearchHistory() {
    const select = document.getElementById('searchHistorySelect');
    const selectedIndex = select.value;
    
    if (selectedIndex !== '') {
        const recentSearches = searchHistory.slice(-10).reverse();
        const search = recentSearches[selectedIndex];
        
        if (search) {
            applyFilters(search.filters);
            performSearch();
        }
    }
}

function clearSearchHistory() {
    if (confirm('Clear all search history?')) {
        searchHistory = [];
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        populateSearchHistory();
    }
}

// Saved searches functions
function saveCurrentSearch() {
    const hasActiveFilters = currentFilters.searchText || 
                            currentFilters.grades.length > 0 || 
                            currentFilters.subjects.length > 0 || 
                            currentFilters.days.length > 0 || 
                            currentFilters.startTime || 
                            currentFilters.endTime;
    
    if (!hasActiveFilters) {
        alert('Please set some filters before saving a search.');
        return;
    }
    
    const searchName = prompt('Enter a name for this saved search:', generateSearchName());
    
    if (searchName && searchName.trim()) {
        const savedSearch = {
            name: searchName.trim(),
            filters: { ...currentFilters },
            timestamp: Date.now()
        };
        
        // Remove duplicate if exists
        savedSearches = savedSearches.filter(s => s.name !== searchName.trim());
        
        // Add to saved searches
        savedSearches.push(savedSearch);
        
        // Save to localStorage
        localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
        
        // Update UI
        populateSavedSearches();
        
        alert('Search saved successfully!');
    }
}

function loadSavedSearch() {
    const select = document.getElementById('savedSearchesSelect');
    const selectedIndex = select.value;
    
    if (selectedIndex !== '') {
        const search = savedSearches[selectedIndex];
        
        if (search) {
            applyFilters(search.filters);
            performSearch();
        }
    }
}

function deleteSavedSearch() {
    const select = document.getElementById('savedSearchesSelect');
    const selectedIndex = select.value;
    
    if (selectedIndex !== '') {
        const search = savedSearches[selectedIndex];
        
        if (confirm(`Delete saved search "${search.name}"?`)) {
            savedSearches.splice(selectedIndex, 1);
            localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
            populateSavedSearches();
        }
    } else {
        alert('Please select a saved search to delete.');
    }
}

function applyFilters(filters) {
    // Clear current filters
    clearAllFilters();
    
    // Apply new filters
    currentFilters = { ...filters };
    
    // Update UI
    document.getElementById('searchInput').value = currentFilters.searchText;
    
    // Update checkboxes
    currentFilters.grades.forEach(grade => {
        const checkbox = document.getElementById(`grade-${grade}`);
        if (checkbox) checkbox.checked = true;
    });
    
    currentFilters.subjects.forEach(subject => {
        const checkbox = document.getElementById(`subject-${subject}`);
        if (checkbox) checkbox.checked = true;
    });
    
    currentFilters.days.forEach(day => {
        const checkbox = document.getElementById(`day-${day}`);
        if (checkbox) checkbox.checked = true;
    });
    
    document.getElementById('startTime').value = currentFilters.startTime;
    document.getElementById('endTime').value = currentFilters.endTime;
}

// Export functions
function toggleExportOptions() {
    const exportOptions = document.getElementById('exportOptions');
    exportOptions.style.display = exportOptions.style.display === 'none' ? 'block' : 'none';
}

function exportToCSV() {
    if (currentSearchResults.length === 0) {
        alert('No results to export. Please perform a search first.');
        return;
    }

    const csvContent = generateCSV(currentSearchResults);
    downloadFile(csvContent, 'schedule-search-results.csv', 'text/csv');
}

function exportToExcel() {
    if (currentSearchResults.length === 0) {
        alert('No results to export. Please perform a search first.');
        return;
    }
    
    // Create Excel-compatible CSV with proper formatting
    const excelContent = generateExcelFormat(currentSearchResults);
    downloadFile(excelContent, 'schedule-search-results.xls', 'application/vnd.ms-excel');
}

function exportToJSON() {
    if (currentSearchResults.length === 0) {
        alert('No results to export. Please perform a search first.');
        return;
    }
    
    const jsonContent = JSON.stringify(currentSearchResults, null, 2);
    downloadFile(jsonContent, 'schedule-search-results.json', 'application/json');
}

function exportToPDF() {
    if (currentSearchResults.length === 0) {
        alert('No results to export. Please perform a search first.');
        return;
    }
    
    // Simple PDF generation (in a real app, you'd use a library like jsPDF)
    const pdfContent = generatePDF(currentSearchResults);
    downloadFile(pdfContent, 'schedule-search-results.pdf', 'application/pdf');
}

function copyToClipboard() {
    if (currentSearchResults.length === 0) {
        alert('No results to copy. Please perform a search first.');
        return;
    }
    
    const textContent = generateText(currentSearchResults);
    navigator.clipboard.writeText(textContent).then(() => {
        alert('Results copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy to clipboard. Please try again.');
    });
}

function generateCSV(results) {
    const headers = ['Day', 'Grade', 'Subject', 'Start Time', 'End Time', 'Type', 'Date'];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
        const row = [
            result.day,
            result.grade || '',
            result.subject,
            result.startTime,
            result.endTime,
            result.source,
            result.date || ''
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function generatePDF(results) {
    // Simple text-based PDF (in production, use jsPDF library)
    let content = 'Schedule Search Results\n';
    content += 'Generated: ' + new Date().toLocaleString() + '\n\n';
    
    results.forEach(result => {
        content += `${result.day} - ${result.grade || 'No Grade'} - ${result.subject}\n`;
        content += `Time: ${result.startTime} - ${result.endTime}\n`;
        if (result.date) content += `Date: ${result.date}\n`;
        content += `Type: ${result.source}\n\n`;
    });
    
    return content;
}

function generateExcelFormat(results) {
    // Create Excel-compatible CSV with UTF-8 BOM for proper character encoding
    const headers = ['Grade', 'Subject', 'Day', 'Start Time', 'End Time', 'Date', 'Type'];
    let content = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    content += headers.join('\t') + '\n';
    
    results.forEach(result => {
        const row = [
            result.grade || '',
            result.subject || '',
            result.day || '',
            result.startTime || '',
            result.endTime || '',
            result.date || '',
            result.source === 'weekday' ? 'Weekly' : 'Specific Date'
        ];
        content += row.join('\t') + '\n';
    });
    
    return content;
}

function generateText(results) {
    let content = 'Schedule Search Results\n';
    content += 'Generated: ' + new Date().toLocaleString() + '\n\n';
    
    results.forEach(result => {
        content += `${result.day} - ${result.grade || 'No Grade'} - ${result.subject}\n`;
        content += `Time: ${result.startTime} - ${result.endTime}\n`;
        if (result.date) content += `Date: ${result.date}\n`;
        content += `Type: ${result.source}\n\n`;
    });
    
    return content;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Global variables for editing
let editingEvent = null;
let editingEventData = null;

// Event editing and deletion functions for search results
async function editEventFromSearch(dateStr, weekDay, index) {
    // Prevent event bubbling to avoid navigating to calendar
    event.stopPropagation();
    
    console.log('✏️ Edit event from search:', { dateStr, weekDay, index });
    
    // Get the event data - handle null dateStr for weekday-only events
    const daySchedule = dateStr ? schedule.specific_dates[dateStr] : schedule.weekdays[weekDay];
    const event = daySchedule[index];
    
    if (!event) {
        console.error('Event not found:', { dateStr, weekDay, index });
        alert('Event not found. It may have been deleted.');
        return;
    }
    
    // Store editing context
    editingEvent = { dateStr, weekDay, index };
    editingEventData = { ...event };
    
    // Populate the modal form
    populateEditModal(event, dateStr, weekDay);
    
    // Show the modal
    document.getElementById('editEventModal').style.display = 'flex';
}

async function deleteEventFromSearch(dateStr, weekDay, index) {
    // Prevent event bubbling to avoid navigating to calendar
    event.stopPropagation();
    
    console.log('🗑️ Delete event from search:', { dateStr, weekDay, index });
    
    if (!confirm('Are you sure you want to delete this event?')) {
        console.log('❌ User cancelled deletion');
        return;
    }
    
    console.log('✅ User confirmed deletion');
    
    // Handle null dateStr for weekday-only events
    const daySchedule = dateStr ? schedule.specific_dates[dateStr] : schedule.weekdays[weekDay];
    console.log('📅 Day schedule before deletion:', daySchedule);
    console.log('📊 Full schedule before deletion:', schedule);
    console.log('🔍 Index to delete:', index);
    
    if (!daySchedule || !Array.isArray(daySchedule)) {
        console.error('❌ Invalid day schedule:', daySchedule);
        alert('Error: Invalid schedule data');
        return;
    }
    
    console.log('🔍 About to splice index', index, 'from array of length', daySchedule.length);
    const removedItem = daySchedule.splice(index, 1);
    console.log('🔍 Removed item:', removedItem);
    console.log('📅 Day schedule after deletion:', daySchedule);
    console.log('🔍 Array length after splice:', daySchedule.length);
    
    // If no events left, remove the day
    if (daySchedule.length === 0) {
        if (dateStr) {
            delete schedule.specific_dates[dateStr];
        } else {
            delete schedule.weekdays[weekDay];
        }
    }
    
    // Save the updated schedule
    try {
        const headers = supabaseAuth.getAuthHeaders();
        const response = await fetch('/api/schedule', {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schedule)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save schedule: ${response.status}`);
        }
        
        console.log('✅ Schedule saved successfully');
        
        // Refresh the search results
        performSearch();
        
        // Show success message
        showNotification('Event deleted successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving schedule:', error);
        alert('Error saving schedule: ' + error.message);
        
        // Revert the change
        daySchedule.splice(index, 0, removedItem[0]);
        if (dateStr) {
            schedule.specific_dates[dateStr] = daySchedule;
        } else {
            schedule.weekdays[weekDay] = daySchedule;
        }
    }
}

// Calendar integration functions
function navigateToCalendarWithHighlight(result) {
    // Store highlight data in localStorage
    const highlightData = {
        day: result.day,
        grade: result.grade,
        subject: result.subject,
        startTime: result.startTime,
        endTime: result.endTime,
        timestamp: Date.now()
    };
    
    localStorage.setItem('calendarHighlight', JSON.stringify(highlightData));
    
    // Navigate to calendar
    window.location.href = 'index.html';
}

// Function to be called from calendar page to apply highlights
function applyCalendarHighlights() {
    const highlightData = localStorage.getItem('calendarHighlight');
    
    if (highlightData) {
        try {
            const data = JSON.parse(highlightData);
            
            // Check if highlight is recent (within 30 seconds)
            if (Date.now() - data.timestamp < 30000) {
                highlightMatchingCalendarEvents(data);
                
                // Clear highlight data after applying
                localStorage.removeItem('calendarHighlight');
            }
        } catch (error) {
            console.error('Error parsing highlight data:', error);
        }
    }
}

function highlightMatchingCalendarEvents(highlightData) {
    // This function would be called from the calendar page
    // to highlight matching events
    console.log('Highlighting calendar events:', highlightData);
    
    // Add visual indicators to matching calendar days
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach(dayEl => {
        const dayText = dayEl.textContent;
        if (dayText && !isNaN(dayText)) {
            // This is a day number - we'd need to determine the actual date
            // and check if it matches our highlight criteria
            // For now, we'll add a simple highlight class
            dayEl.classList.add('highlighted-search-result');
        }
    });
    
    // Show a notification about the highlight
    showHighlightNotification(highlightData);
}

function showHighlightNotification(highlightData) {
    const notification = document.createElement('div');
    notification.className = 'highlight-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 6px;
        padding: 15px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <strong>🔍 Search Result Highlighted</strong><br>
        ${highlightData.grade} - ${highlightData.subject}<br>
        ${highlightData.day} at ${highlightData.startTime}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Setup event listeners for buttons
function setupButtonEventListeners() {
    // Authentication buttons
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('signupBtn').addEventListener('click', handleSignUp);
    document.getElementById('signoutBtn').addEventListener('click', handleSignOut);
    document.getElementById('showSignUpLink').addEventListener('click', (e) => {
        e.preventDefault();
        showSignUp();
    });
    document.getElementById('showLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    // Navigation buttons
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Search buttons
    document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('exportBtn').addEventListener('click', toggleExportOptions);
}

// Modal functions
function populateEditModal(event, dateStr, weekDay) {
    // Set day - determine if it's a specific date or weekday
    const daySelect = document.getElementById('editDay');
    if (dateStr) {
        // This is a specific date event
        const day = getWeekDay(new Date(dateStr));
        daySelect.value = day;
        daySelect.disabled = true; // Can't change day for specific date events
    } else {
        // This is a weekday event
        daySelect.value = weekDay;
        daySelect.disabled = false;
    }
    
    // Set other fields
    document.getElementById('editGrade').value = event.grade || '';
    document.getElementById('editSubject').value = event.subject || '';
    document.getElementById('editStartTime').value = event.startTime || '';
    document.getElementById('editEndTime').value = event.endTime || '';
    document.getElementById('editSpecificDate').value = dateStr || '';
}

function closeEditModal() {
    document.getElementById('editEventModal').style.display = 'none';
    editingEvent = null;
    editingEventData = null;
}

async function saveEditedEvent() {
    try {
        // Get form data
        const day = document.getElementById('editDay').value;
        const grade = document.getElementById('editGrade').value.trim();
        const subject = document.getElementById('editSubject').value;
        const startTime = document.getElementById('editStartTime').value;
        const endTime = document.getElementById('editEndTime').value;
        const specificDate = document.getElementById('editSpecificDate').value;
        
        // Validate form
        if (!day || !grade || !subject || !startTime || !endTime) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Create updated event
        const updatedEvent = {
            grade: grade,
            subject: subject,
            startTime: startTime,
            endTime: endTime
        };
        
        // Determine if this is a specific date or weekday event
        const isSpecificDate = specificDate && specificDate.trim() !== '';
        const targetDateStr = isSpecificDate ? specificDate : null;
        const targetWeekDay = isSpecificDate ? null : day;
        
        // Remove from old location
        if (editingEvent.dateStr) {
            // Was a specific date event
            const oldDaySchedule = schedule.specific_dates[editingEvent.dateStr];
            if (oldDaySchedule) {
                oldDaySchedule.splice(editingEvent.index, 1);
                if (oldDaySchedule.length === 0) {
                    delete schedule.specific_dates[editingEvent.dateStr];
                }
            }
        } else {
            // Was a weekday event
            const oldDaySchedule = schedule.weekdays[editingEvent.weekDay];
            if (oldDaySchedule) {
                oldDaySchedule.splice(editingEvent.index, 1);
                if (oldDaySchedule.length === 0) {
                    delete schedule.weekdays[editingEvent.weekDay];
                }
            }
        }
        
        // Add to new location
        if (isSpecificDate) {
            // Add to specific dates
            if (!schedule.specific_dates[targetDateStr]) {
                schedule.specific_dates[targetDateStr] = [];
            }
            schedule.specific_dates[targetDateStr].push(updatedEvent);
        } else {
            // Add to weekdays
            if (!schedule.weekdays[targetWeekDay]) {
                schedule.weekdays[targetWeekDay] = [];
            }
            schedule.weekdays[targetWeekDay].push(updatedEvent);
        }
        
        // Save to server
        const headers = supabaseAuth.getAuthHeaders();
        const response = await fetch('/api/schedule', {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schedule)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save schedule: ${response.status}`);
        }
        
        console.log('✅ Event updated successfully');
        
        // Close modal
        closeEditModal();
        
        // Refresh search results
        performSearch();
        
        // Show success message
        showNotification('Event updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error updating event:', error);
        alert('Error updating event: ' + error.message);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
        border-radius: 6px;
        padding: 15px 20px;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
    `;
    
    notification.innerHTML = `
        ${type === 'success' ? '✅' : 'ℹ️'} ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupButtonEventListeners();
    initApp();
});
