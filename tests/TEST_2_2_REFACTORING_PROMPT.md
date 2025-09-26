# Test 2.2: Schedule Display - Refactoring Prompt

## Context
Based on the failed execution of Test 2.2 (Schedule Display functionality), several critical issues have been identified in the Schedule Editor application that require immediate attention. The test revealed problems with schedule data loading, calendar day visual indicators, and schedule list population.

## Refactoring Instructions

### 1. Fix Schedule Data Loading and Display

**Problem:** Schedule data exists in `data/schedule.json` but is not being properly loaded and displayed in the calendar view.

**Required Changes:**

1. **Update the main calendar script (`public/js/script.js`):**
   ```javascript
   // Ensure schedule data is loaded and properly formatted
   async function loadSchedule() {
       try {
           // Load schedule data from the server or local file
           const response = await fetch('/api/schedule');
           const data = await response.json();
           
           // Process and store the schedule data
           schedule = data;
           
           // Update calendar display with schedule data
           updateCalendarWithSchedule();
           
           // Add visual indicators for days with events
           markDaysWithEvents();
           
       } catch (error) {
           console.error('Failed to load schedule:', error);
           // Fallback to local data if API fails
           loadLocalScheduleData();
       }
   }
   
   // Add visual indicators for calendar days with events
   function markDaysWithEvents() {
       const calendarDays = document.querySelectorAll('#calendar > div');
       
       calendarDays.forEach(day => {
           const dayNumber = day.textContent.trim();
           if (isValidDay(dayNumber)) {
               const dayOfWeek = getDayOfWeek(dayNumber);
               const hasEvents = schedule.weekdays[dayOfWeek] && schedule.weekdays[dayOfWeek].length > 0;
               
               if (hasEvents) {
                   day.classList.add('has-events');
                   day.style.backgroundColor = '#e3f2fd';
                   day.style.border = '2px solid #2196f3';
               }
           }
       });
   }
   ```

2. **Update calendar day click handling:**
   ```javascript
   // Enhanced day click handler
   function handleDayClick(event) {
       const dayElement = event.target;
       const dayNumber = dayElement.textContent.trim();
       
       if (isValidDay(dayNumber)) {
           const dayOfWeek = getDayOfWeek(dayNumber);
           const events = schedule.weekdays[dayOfWeek] || [];
           
           // Clear previous selection
           document.querySelectorAll('#calendar > div').forEach(day => {
               day.classList.remove('selected');
           });
           
           // Mark selected day
           dayElement.classList.add('selected');
           
           // Display events for the selected day
           displayDayEvents(dayOfWeek, events);
           
           // Update selected date display
           updateSelectedDateDisplay(dayNumber);
       }
   }
   ```

3. **Implement proper event display:**
   ```javascript
   function displayDayEvents(dayOfWeek, events) {
       const scheduleList = document.getElementById('scheduleList');
       
       if (events.length === 0) {
           scheduleList.innerHTML = '<div class="no-events">No classes scheduled for this day</div>';
           return;
       }
       
       // Sort events by start time
       const sortedEvents = events.sort((a, b) => {
           return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
       });
       
       // Create event display HTML
       const eventsHTML = sortedEvents.map(event => `
           <div class="schedule-item">
               <div class="time">${event.startTime} - ${event.endTime}</div>
               <div class="grade">${event.grade || 'All Grades'}</div>
               <div class="subject">${event.subject}</div>
           </div>
       `).join('');
       
       scheduleList.innerHTML = eventsHTML;
   }
   ```

### 2. Improve Calendar Visual Indicators

**Problem:** Calendar days with scheduled events have no visual indicators.

**Required Changes:**

1. **Add CSS styles for event indicators:**
   ```css
   /* Add to public/css/styles.css */
   .calendar-day.has-events {
       background-color: #e3f2fd !important;
       border: 2px solid #2196f3 !important;
       position: relative;
   }
   
   .calendar-day.has-events::after {
       content: '●';
       position: absolute;
       top: 2px;
       right: 2px;
       color: #2196f3;
       font-size: 8px;
   }
   
   .calendar-day.selected {
       background-color: #ffeb3b !important;
       border: 2px solid #ff9800 !important;
   }
   
   .schedule-item {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 10px;
       margin: 5px 0;
       background-color: #f5f5f5;
       border-radius: 4px;
       border-left: 4px solid #2196f3;
   }
   
   .schedule-item .time {
       font-weight: bold;
       color: #1976d2;
       min-width: 120px;
   }
   
   .schedule-item .grade {
       font-weight: bold;
       color: #424242;
       min-width: 60px;
   }
   
   .schedule-item .subject {
       color: #666;
       flex: 1;
   }
   
   .no-events {
       text-align: center;
       color: #666;
       font-style: italic;
       padding: 20px;
   }
   ```

### 3. Fix Quick Search Functionality

**Problem:** Quick search button is not clickable or functional.

**Required Changes:**

1. **Update quick search button handler:**
   ```javascript
   // Ensure quick search button is properly initialized
   document.addEventListener('DOMContentLoaded', function() {
       const quickSearchBtn = document.getElementById('quickSearchBtn');
       const quickSearchInput = document.getElementById('quickSearchInput');
       
       if (quickSearchBtn) {
           quickSearchBtn.addEventListener('click', function() {
               const searchTerm = quickSearchInput.value.trim();
               if (searchTerm) {
                   // Store search term and navigate to search page
                   localStorage.setItem('quickSearchTerm', searchTerm);
                   window.location.href = 'search.html';
               } else {
                   // Navigate to search page without search term
                   window.location.href = 'search.html';
               }
           });
       }
   });
   ```

### 4. Improve Error Handling and Data Validation

**Problem:** Insufficient error handling for data loading and display.

**Required Changes:**

1. **Add comprehensive error handling:**
   ```javascript
   // Add error handling utilities
   function handleScheduleError(error, context) {
       console.error(`Schedule error in ${context}:`, error);
       
       // Display user-friendly error message
       const errorMessage = document.createElement('div');
       errorMessage.className = 'error-message';
       errorMessage.innerHTML = `
           <div class="error-content">
               <h3>Schedule Loading Error</h3>
               <p>Unable to load schedule data. Please refresh the page or contact support.</p>
               <button onclick="location.reload()">Refresh Page</button>
           </div>
       `;
       
       document.body.appendChild(errorMessage);
   }
   
   // Add data validation
   function validateScheduleData(data) {
       if (!data || typeof data !== 'object') {
           throw new Error('Invalid schedule data format');
       }
       
       if (!data.weekdays || typeof data.weekdays !== 'object') {
           throw new Error('Missing or invalid weekdays data');
       }
       
       // Validate each weekday's events
       Object.keys(data.weekdays).forEach(day => {
           if (!Array.isArray(data.weekdays[day])) {
               throw new Error(`Invalid events array for ${day}`);
           }
           
           data.weekdays[day].forEach((event, index) => {
               if (!event.subject || !event.startTime || !event.endTime) {
                   throw new Error(`Invalid event at index ${index} for ${day}`);
               }
           });
       });
       
       return true;
   }
   ```

### 5. Update Server-Side API (if needed)

**Problem:** Schedule data API may not be properly configured.

**Required Changes:**

1. **Ensure schedule API endpoint exists in `src/server.js`:**
   ```javascript
   // Add schedule API endpoint
   app.get('/api/schedule', async (req, res) => {
       try {
           // Read schedule data from file or database
           const scheduleData = require('../data/schedule.json');
           res.json(scheduleData);
       } catch (error) {
           console.error('Error loading schedule data:', error);
           res.status(500).json({ error: 'Failed to load schedule data' });
       }
   });
   ```

## Testing Instructions

After implementing these changes:

1. **Manual Testing:**
   - Open the application in a browser
   - Verify calendar days with events have visual indicators
   - Click on days with events and verify schedule list displays
   - Click on days without events and verify "No classes" message
   - Test quick search functionality

2. **Re-run Test 2.2:**
   - Execute the automated test again
   - Verify all test steps pass
   - Check that pass rate is above 80%

## Expected Outcomes

After implementing these fixes:
- ✅ Calendar days with events will have visual indicators
- ✅ Clicking on calendar days will properly display schedule events
- ✅ Events will be sorted by start time
- ✅ Days with no events will show appropriate messages
- ✅ Quick search functionality will work correctly
- ✅ Test 2.2 will pass with a high success rate

## Priority Level: HIGH

These issues are critical for the basic functionality of the Schedule Editor application and should be addressed immediately to ensure proper user experience and application reliability.
