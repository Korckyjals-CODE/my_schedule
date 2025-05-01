let schedule = {
    weekdays: {},
    specific_dates: {}
};
let currentDate = new Date();
let selectedDate = null;

// Load schedule data
fetch('/js/schedule.json')
    .then(response => response.json())
    .then(data => {
        schedule = data;
        renderCalendar();
    })
    .catch(error => console.error('Error loading schedule:', error));

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
        if (schedule.specific_dates[dateStr] || schedule.weekdays[weekDay]) {
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
    
    // Check for specific date schedule first, then fall back to weekday schedule
    const daySchedule = schedule.specific_dates[dateStr] || schedule.weekdays[weekDay];
    
    // Show schedule for selected date
    if (daySchedule) {
        daySchedule.forEach(classInfo => {
            const classBox = document.createElement('div');
            classBox.className = 'class-box';
            classBox.innerHTML = `
                <div class="grade">${classInfo.grade} - ${classInfo.subject}</div>
                <div class="time">${classInfo.startTime} - ${classInfo.endTime}</div>
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