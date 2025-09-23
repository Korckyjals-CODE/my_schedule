// Mock data for testing search functionality
const MOCK_SCHEDULE = {
    weekdays: {
        "Monday": [
            { "grade": "11A", "startTime": "7:45", "endTime": "8:30", "subject": "Class" },
            { "grade": "6A", "startTime": "8:30", "endTime": "9:15", "subject": "Class" },
            { "grade": "", "startTime": "9:15", "endTime": "9:45", "subject": "Recess" },
            { "grade": "3A", "startTime": "9:45", "endTime": "10:30", "subject": "Class" },
            { "grade": "", "startTime": "12:45", "endTime": "13:30", "subject": "Lunch" }
        ],
        "Tuesday": [
            { "grade": "4A", "startTime": "7:45", "endTime": "8:30", "subject": "Class" },
            { "grade": "5B", "startTime": "8:30", "endTime": "9:15", "subject": "Class" },
            { "grade": "", "startTime": "9:15", "endTime": "9:45", "subject": "Recess" },
            { "grade": "1A", "startTime": "9:45", "endTime": "10:30", "subject": "Class" },
            { "grade": "", "startTime": "12:45", "endTime": "13:30", "subject": "Lunch" }
        ],
        "Wednesday": [
            { "grade": "1B", "startTime": "7:45", "endTime": "8:30", "subject": "Class" },
            { "grade": "1B", "startTime": "8:30", "endTime": "9:15", "subject": "Class" },
            { "grade": "", "startTime": "9:15", "endTime": "9:45", "subject": "Recess" },
            { "grade": "5A", "startTime": "9:45", "endTime": "10:30", "subject": "Class" },
            { "grade": "", "startTime": "12:45", "endTime": "13:30", "subject": "Lunch" }
        ],
        "Thursday": [
            { "grade": "7A", "startTime": "7:45", "endTime": "8:30", "subject": "Class" },
            { "grade": "8A", "startTime": "8:30", "endTime": "9:15", "subject": "Class" },
            { "grade": "", "startTime": "10:00", "endTime": "10:30", "subject": "Recess" },
            { "grade": "2A", "startTime": "10:30", "endTime": "11:15", "subject": "Class" },
            { "grade": "", "startTime": "12:45", "endTime": "13:30", "subject": "Lunch" }
        ],
        "Friday": [
            { "grade": "5B", "startTime": "7:45", "endTime": "8:30", "subject": "Class" },
            { "grade": "4B", "startTime": "8:30", "endTime": "9:15", "subject": "Class" },
            { "grade": "6A", "startTime": "9:15", "endTime": "10:00", "subject": "Class" },
            { "grade": "", "startTime": "10:00", "endTime": "10:30", "subject": "Recess" },
            { "grade": "3A", "startTime": "10:30", "endTime": "11:15", "subject": "Class" },
            { "grade": "", "startTime": "12:45", "endTime": "13:30", "subject": "Lunch" }
        ]
    },
    specific_dates: {
        "2024-01-15": [
            { "grade": "12A", "startTime": "8:00", "endTime": "8:45", "subject": "Class" },
            { "grade": "", "startTime": "8:45", "endTime": "9:00", "subject": "Assembly" }
        ]
    }
};

// Mock authentication for testing
const MOCK_AUTH = {
    async checkAuth() {
        return true; // Always authenticated for testing
    },
    getCurrentUser() {
        return { email: 'test@example.com' };
    },
    getAuthHeaders() {
        return { 'Authorization': 'Bearer mock-token' };
    }
};

// Override the real auth for testing
if (typeof supabaseAuth === 'undefined') {
    window.supabaseAuth = MOCK_AUTH;
}

// Override schedule loading for testing
function loadScheduleMock() {
    schedule = MOCK_SCHEDULE;
    console.log('Mock schedule loaded:', schedule);
    initializeSearchInterface();
}

// Override the loadSchedule function
window.loadSchedule = loadScheduleMock;
