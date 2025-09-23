let schedule = {
    weekdays: {},
    specific_dates: {}
};
let currentDate = new Date();
let selectedDate = null;

// Modal editing variables
let editingEvent = null;
let editingEventData = null;

// Authentication functions
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
}

// Initialize app
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
        renderCalendar();
    } catch (error) {
        console.error('Error loading schedule:', error);
        if (error.message.includes('No authentication token')) {
            showAuth();
        }
    }
}

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendarEl = document.getElementById('calendar');
    
    // Clear previous calendar
    calendarEl.innerHTML = '';
    
    // Set month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Get first day of month and total days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarEl.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Check if this day has any schedule
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(checkDate);
        const weekDay = getWeekDay(checkDate);
        const hasSpecificEvents = schedule.specific_dates[dateStr] && schedule.specific_dates[dateStr].length > 0;
        const hasWeekdayEvents = schedule.weekdays[weekDay] && schedule.weekdays[weekDay].length > 0;
        if (hasSpecificEvents || hasWeekdayEvents) {
            dayEl.style.fontWeight = 'bold';
        }
        
        // Mark today
        if (isToday(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))) {
            dayEl.classList.add('today');
        }
        
        // Mark selected date
        if (selectedDate && isSameDay(selectedDate, new Date(currentDate.getFullYear(), currentDate.getMonth(), day))) {
            dayEl.classList.add('selected');
        }
        
        dayEl.addEventListener('click', () => selectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)));
        calendarEl.appendChild(dayEl);
    }
}

function selectDate(date) {
    selectedDate = date;
    const dateStr = formatDate(date);
    const weekDay = getWeekDay(date);
    const selectedDateEl = document.getElementById('selectedDate');
    const scheduleList = document.getElementById('scheduleList');
    
    // Update selected date display
    selectedDateEl.textContent = `Schedule for ${dateStr} (${weekDay})`;
    
    // Clear previous schedule
    scheduleList.innerHTML = '';
    
    // Combine specific date schedule and weekday schedule if both exist
    const specificSchedule = schedule.specific_dates[dateStr] || [];
    const weekdaySchedule = schedule.weekdays[weekDay] || [];
    const daySchedule = [...specificSchedule, ...weekdaySchedule];
    
    // Show schedule for selected date
    if (daySchedule.length > 0) {
        // Sort events by start time in ascending order
        const sortedSchedule = [...daySchedule].sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
        });
        
        sortedSchedule.forEach((classInfo, sortedIndex) => {
            // Determine if this event comes from specific dates or weekdays
            const isFromSpecific = specificSchedule.some(item => 
                item.grade === classInfo.grade && 
                item.subject === classInfo.subject && 
                item.startTime === classInfo.startTime && 
                item.endTime === classInfo.endTime
            );
            
            // Find the actual index in the appropriate source array
            let actualIndex, sourceDateStr, sourceWeekDay;
            if (isFromSpecific) {
                actualIndex = specificSchedule.findIndex(item => 
                    item.grade === classInfo.grade && 
                    item.subject === classInfo.subject && 
                    item.startTime === classInfo.startTime && 
                    item.endTime === classInfo.endTime
                );
                sourceDateStr = dateStr;
                sourceWeekDay = weekDay;
            } else {
                actualIndex = weekdaySchedule.findIndex(item => 
                    item.grade === classInfo.grade && 
                    item.subject === classInfo.subject && 
                    item.startTime === classInfo.startTime && 
                    item.endTime === classInfo.endTime
                );
                sourceDateStr = null; // No specific date for weekday events
                sourceWeekDay = weekDay;
            }
            
            console.log(`🔍 Item: ${classInfo.grade} - ${classInfo.subject} (${classInfo.startTime})`);
            console.log(`🔍 From specific: ${isFromSpecific}, Actual index: ${actualIndex}`);
            
            const classBox = document.createElement('div');
            classBox.className = 'class-box';
            classBox.innerHTML = `
                <div class="class-content">
                    <div class="grade">${classInfo.grade} - ${classInfo.subject}</div>
                    <div class="time">${classInfo.startTime} - ${classInfo.endTime}</div>
                </div>
                <div class="hover-buttons">
                    <button class="edit-btn" onclick="editEventFromCalendar('${sourceDateStr}', '${sourceWeekDay}', ${actualIndex})" title="Edit Event">✏️</button>
                    <button class="delete-btn" onclick="deleteEventFromCalendar('${sourceDateStr}', '${sourceWeekDay}', ${actualIndex})" title="Delete Event">🗑️</button>
                </div>
            `;
            scheduleList.appendChild(classBox);
        });
    } else {
        scheduleList.innerHTML = '<p>No classes scheduled for this day.</p>';
    }
    
    renderCalendar();
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isToday(date) {
    const today = new Date();
    return isSameDay(date, today);
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function getWeekDay(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Event listeners for month navigation
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside of it
    document.getElementById('editEventModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('editEventModal').style.display === 'flex') {
            closeEditModal();
        }
    });
});

// Event editing and deletion functions
async function editEventFromCalendar(dateStr, weekDay, index) {
    // Get the event data - handle null dateStr for weekday-only events
    const daySchedule = dateStr ? schedule.specific_dates[dateStr] : schedule.weekdays[weekDay];
    const event = daySchedule[index];
    
    // Store editing context
    editingEvent = { dateStr, weekDay, index };
    editingEventData = { ...event };
    
    // Populate the modal form
    populateEditModal(event, dateStr, weekDay);
    
    // Show the modal
    document.getElementById('editEventModal').style.display = 'flex';
}

function populateEditModal(event, dateStr, weekDay) {
    // Set day - determine if it's a specific date or weekday
    const daySelect = document.getElementById('editDay');
    const specificDateInput = document.getElementById('editSpecificDate');
    
    if (dateStr && schedule.specific_dates[dateStr]) {
        // It's a specific date
        specificDateInput.value = dateStr;
        daySelect.value = weekDay; // Set weekday as fallback
    } else {
        // It's a weekday
        daySelect.value = weekDay;
        specificDateInput.value = '';
    }
    
    // Set other fields
    document.getElementById('editGrade').value = event.grade || '';
    document.getElementById('editStartTime').value = padTime(event.startTime);
    document.getElementById('editEndTime').value = padTime(event.endTime);
    document.getElementById('editSubject').value = event.subject || 'Class';
}

function padTime(timeStr) {
    // Convert time format from "H:MM" to "HH:MM" for HTML time input
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    return parts[0].padStart(2, '0') + ':' + parts[1];
}

function closeEditModal() {
    document.getElementById('editEventModal').style.display = 'none';
    editingEvent = null;
    editingEventData = null;
}

async function saveEditedEvent() {
    try {
        // Get form values
        const day = document.getElementById('editDay').value;
        const grade = document.getElementById('editGrade').value;
        const startTime = document.getElementById('editStartTime').value;
        const endTime = document.getElementById('editEndTime').value;
        const subject = document.getElementById('editSubject').value;
        const specificDate = document.getElementById('editSpecificDate').value;
        
        // Validate required fields
        if (!startTime || !endTime || !subject) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Convert time format from "HH:MM" to "H:MM" for storage
        const formattedStartTime = formatTimeForStorage(startTime);
        const formattedEndTime = formatTimeForStorage(endTime);
        
        // Create updated event object
        const updatedEvent = {
            grade: grade,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            subject: subject
        };
        
        // Determine target location
        let targetDateStr = null;
        let targetWeekDay = day;
        
        if (specificDate) {
            targetDateStr = specificDate;
        }
        
        // Remove from original location
        const originalSchedule = editingEvent.dateStr ? schedule.specific_dates[editingEvent.dateStr] : schedule.weekdays[editingEvent.weekDay];
        originalSchedule.splice(editingEvent.index, 1);
        
        // Add to new location
        if (targetDateStr) {
            // Add to specific date
            if (!schedule.specific_dates[targetDateStr]) {
                schedule.specific_dates[targetDateStr] = [];
            }
            schedule.specific_dates[targetDateStr].push(updatedEvent);
        } else {
            // Add to weekday
            if (!schedule.weekdays[targetWeekDay]) {
                schedule.weekdays[targetWeekDay] = [];
            }
            schedule.weekdays[targetWeekDay].push(updatedEvent);
        }
        
        // Sort the schedule by start time
        if (targetDateStr && schedule.specific_dates[targetDateStr]) {
            schedule.specific_dates[targetDateStr].sort((a, b) => a.startTime.localeCompare(b.startTime));
        } else if (schedule.weekdays[targetWeekDay]) {
            schedule.weekdays[targetWeekDay].sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        
        // Save and refresh
        await saveSchedule();
        selectDate(selectedDate); // Refresh the current view
        
        // Close modal
        closeEditModal();
        
    } catch (error) {
        console.error('Error saving edited event:', error);
        alert('Error saving changes. Please try again.');
    }
}

function formatTimeForStorage(timeStr) {
    // Convert time format from "HH:MM" to "H:MM" for storage
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    return parts[0].replace(/^0+/, '') + ':' + parts[1];
}

async function deleteEventFromCalendar(dateStr, weekDay, index) {
    console.log('🗑️ Delete function called with:', { dateStr, weekDay, index });
    
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
    console.log('🔍 Array length before splice:', daySchedule ? daySchedule.length : 'undefined');
    console.log('🔍 Is daySchedule the same reference as schedule.specific_dates[dateStr]?', daySchedule === schedule.specific_dates[dateStr]);
    console.log('🔍 Is daySchedule the same reference as schedule.weekdays[weekDay]?', daySchedule === schedule.weekdays[weekDay]);
    console.log('🔍 schedule.specific_dates[dateStr]:', schedule.specific_dates[dateStr]);
    console.log('🔍 schedule.weekdays[weekDay]:', schedule.weekdays[weekDay]);
    
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
        if (dateStr && schedule.specific_dates[dateStr]) {
            delete schedule.specific_dates[dateStr];
            console.log('🗑️ Removed specific date:', dateStr);
        } else if (schedule.weekdays[weekDay]) {
            delete schedule.weekdays[weekDay];
            console.log('🗑️ Removed weekday:', weekDay);
        }
    }
    
    console.log('📊 Full schedule after deletion:', schedule);
    
    // Save and refresh
    try {
        console.log('💾 Attempting to save schedule...');
        await saveSchedule();
        console.log('✅ Schedule saved successfully');
        selectDate(selectedDate); // Refresh the current view
        console.log('🔄 View refreshed');
    } catch (error) {
        console.error('❌ Error saving schedule:', error);
        alert('Failed to save changes: ' + error.message);
    }
}

async function saveSchedule() {
    try {
        console.log('🔐 Getting auth headers...');
        const headers = supabaseAuth.getAuthHeaders();
        console.log('📤 Sending schedule to server:', schedule);
        
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(schedule)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('🔒 Authentication failed, redirecting to auth');
                showAuth();
                return;
            }
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`Failed to save schedule: ${response.status} ${errorText}`);
        }

        const responseData = await response.json();
        console.log('✅ Schedule saved successfully:', responseData);
    } catch (error) {
        console.error('❌ Error saving schedule:', error);
        alert('Failed to save changes: ' + error.message);
    }
}