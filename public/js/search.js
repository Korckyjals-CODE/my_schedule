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
    setupEventListeners();
    
    // Show all results initially
    setTimeout(() => {
        displayAllResults();
    }, 100);
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
function performSearch() {
    console.log('Performing search with filters:', currentFilters);
    
    // Check if any filters are active
    const hasActiveFilters = currentFilters.searchText || 
                            currentFilters.grades.length > 0 || 
                            currentFilters.subjects.length > 0 || 
                            currentFilters.days.length > 0 || 
                            currentFilters.startTime || 
                            currentFilters.endTime;
    
    if (!hasActiveFilters) {
        // Show all results when no filters are applied
        displayAllResults();
    } else {
        const results = searchSchedule();
        displayResults(results);
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
function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    console.log('📊 Displaying', results.length, 'results');
    
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
            resultsCount.textContent = `${results.length} result${results.length === 1 ? '' : 's'} found`;
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
            `;
            
            // Add click handler to highlight in calendar (future feature)
            resultItem.style.cursor = 'pointer';
            resultItem.addEventListener('click', () => {
                console.log('Clicked result:', result);
                // Future: navigate to calendar and highlight this event
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupButtonEventListeners();
    initApp();
});
