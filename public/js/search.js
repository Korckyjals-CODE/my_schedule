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
    
    const results = searchSchedule();
    displayResults(results);
}

// Search through schedule data
function searchSchedule() {
    const results = [];
    
    // Search through weekdays
    Object.entries(schedule.weekdays).forEach(([day, events]) => {
        events.forEach((event, index) => {
            if (matchesFilters(event, day, null)) {
                results.push({
                    ...event,
                    day: day,
                    date: null,
                    type: 'weekday',
                    index: index
                });
            }
        });
    });
    
    // Search through specific dates
    Object.entries(schedule.specific_dates).forEach(([date, events]) => {
        events.forEach((event, index) => {
            const day = getWeekDay(new Date(date));
            if (matchesFilters(event, day, date)) {
                results.push({
                    ...event,
                    day: day,
                    date: date,
                    type: 'specific',
                    index: index
                });
            }
        });
    });
    
    return results;
}

// Check if event matches current filters
function matchesFilters(event, day, date) {
    // Text search
    if (currentFilters.searchText) {
        const searchText = currentFilters.searchText;
        const eventText = `${event.grade} ${event.subject} ${event.startTime} ${event.endTime} ${day}`.toLowerCase();
        if (!eventText.includes(searchText)) {
            return false;
        }
    }
    
    // Grade filter
    if (currentFilters.grades.length > 0 && event.grade) {
        if (!currentFilters.grades.includes(event.grade)) {
            return false;
        }
    }
    
    // Subject filter
    if (currentFilters.subjects.length > 0) {
        if (!currentFilters.subjects.includes(event.subject)) {
            return false;
        }
    }
    
    // Day filter
    if (currentFilters.days.length > 0) {
        if (!currentFilters.days.includes(day)) {
            return false;
        }
    }
    
    // Time filter
    if (currentFilters.startTime || currentFilters.endTime) {
        const eventStart = convertTimeToMinutes(event.startTime);
        const eventEnd = convertTimeToMinutes(event.endTime);
        
        if (currentFilters.startTime) {
            const filterStart = convertTimeToMinutes(currentFilters.startTime);
            if (eventEnd <= filterStart) {
                return false;
            }
        }
        
        if (currentFilters.endTime) {
            const filterEnd = convertTimeToMinutes(currentFilters.endTime);
            if (eventStart >= filterEnd) {
                return false;
            }
        }
    }
    
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
    
    // Update results count
    if (results.length === 0) {
        resultsCount.textContent = 'No results found';
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h4>🔍 No Results Found</h4>
                <p>Try adjusting your search terms or filters</p>
            </div>
        `;
    } else {
        resultsCount.textContent = `${results.length} result${results.length === 1 ? '' : 's'} found`;
        
        // Create results list
        const resultsList = document.createElement('div');
        resultsList.className = 'results-list';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <div class="result-header">
                    <div class="result-grade">${result.grade || 'No Grade'}</div>
                    <div class="result-day">${result.day}</div>
                </div>
                <div class="result-subject">${result.subject}</div>
                <div class="result-time">${result.startTime} - ${result.endTime}</div>
                ${result.date ? `<div class="result-date" style="font-size: 12px; color: #95a5a6; margin-top: 5px;">Specific Date: ${result.date}</div>` : ''}
            `;
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
