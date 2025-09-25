const SUBJECT_OPTIONS = [
    'Class',
    'Recess',
    'Lunch',
    'Assembly',
    'Form Period',
    'Holiday',
    'Dismissal',
    'Field Trip',
    'Morning Door',
    'Morning Duty',
    'Recess Duty',
    'Lunch Duty',
    'Dismissal Duty',
    'Dismissal Door',
    'Prep',
    'Other'
];

let schedule = {
    weekdays: {},
    specific_dates: {}
};

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

function padTime(timeStr) {
    const [h, m] = timeStr.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

// Load initial schedule with authentication
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
        schedule = data || { weekdays: {}, specific_dates: {} };
        updateWeekdaySchedule();
    } catch (error) {
        console.error('Error loading schedule:', error);
        if (error.message.includes('No authentication token')) {
            showAuth();
        }
        schedule = { weekdays: {}, specific_dates: {} };
        updateWeekdaySchedule();
    }
}

// Function to save schedule changes with authentication
async function saveSchedule() {
    try {
        const headers = supabaseAuth.getAuthHeaders();
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(schedule)
        });

        if (!response.ok) {
            if (response.status === 401) {
                showAuth();
                return;
            }
            throw new Error('Failed to save schedule');
        }

        // Show save status
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.style.display = 'block';
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 2000);
    } catch (error) {
        console.error('Error saving schedule:', error);
        alert('Failed to save changes. Please try again.');
    }
}

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab + 'Editor').classList.add('active');
    });
});

// Weekday schedule handling
document.getElementById('weekday').addEventListener('change', updateWeekdaySchedule);

function updateWeekdaySchedule() {
    const weekday = document.getElementById('weekday').value;
    const container = document.getElementById('weekdaySchedule');
    container.innerHTML = '';

    if (schedule.weekdays[weekday]) {
        schedule.weekdays[weekday].forEach((entry, index) => {
            container.appendChild(createEntryElement(entry, index, 'weekday'));
        });
    }
}

function addWeekdayEntry() {
    const weekday = document.getElementById('weekday').value;
    if (!schedule.weekdays[weekday]) {
        schedule.weekdays[weekday] = [];
    }
    
    const newEntry = {
        grade: "None",
        startTime: "08:00",
        endTime: "08:45",
        subject: "Class"
    };
    
    schedule.weekdays[weekday].push(newEntry);
    updateWeekdaySchedule();
    saveSchedule();
}

// Specific date schedule handling
document.getElementById('specificDate').addEventListener('change', updateSpecificSchedule);

// Range date schedule handling
document.getElementById('rangeStartDate').addEventListener('change', updateRangeWeekdays);
document.getElementById('rangeEndDate').addEventListener('change', updateRangeWeekdays);

function updateSpecificSchedule() {
    const date = document.getElementById('specificDate').value;
    const container = document.getElementById('specificSchedule');
    container.innerHTML = '';

    if (schedule.specific_dates[date]) {
        schedule.specific_dates[date].forEach((entry, index) => {
            container.appendChild(createEntryElement(entry, index, 'specific'));
        });
    }
}

function addSpecificEntry() {
    const date = document.getElementById('specificDate').value;
    if (!date) {
        alert('Please select a date first');
        return;
    }

    if (!schedule.specific_dates[date]) {
        schedule.specific_dates[date] = [];
    }
    
    const newEntry = {
        grade: "None",
        startTime: "08:00",
        endTime: "08:45",
        subject: "Class"
    };
    
    schedule.specific_dates[date].push(newEntry);
    updateSpecificSchedule();
    saveSchedule();
}

// Range date schedule functions
function updateRangeWeekdays() {
    const startDate = document.getElementById('rangeStartDate').value;
    const endDate = document.getElementById('rangeEndDate').value;
    const container = document.getElementById('rangeWeekdays');
    
    container.innerHTML = '';
    
    // Hide the form when dates change
    hideRangeEventForm();
    
    if (!startDate || !endDate) {
        return;
    }
    
    const weekdays = getWeekdaysInRange(startDate, endDate);
    
    weekdays.forEach(day => {
        const tag = document.createElement('span');
        tag.className = 'weekday-tag weekday';
        tag.textContent = day;
        container.appendChild(tag);
    });
    
    // Update the range schedule display
    updateRangeSchedule();
}

function getWeekdaysInRange(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const weekdays = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Ensure start date is not after end date
    if (startDate > endDate) {
        return [];
    }
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        // Only include weekdays (Monday = 1 to Friday = 5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekdays.push(dayNames[dayOfWeek]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weekdays;
}

function updateRangeSchedule() {
    const startDate = document.getElementById('rangeStartDate').value;
    const endDate = document.getElementById('rangeEndDate').value;
    const container = document.getElementById('rangeSchedule');
    
    container.innerHTML = '';
    
    if (!startDate || !endDate) {
        return;
    }
    
    const weekdays = getWeekdaysInRange(startDate, endDate);
    
    if (weekdays.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No weekdays found in the selected date range.</p>';
        return;
    }
    
    // Don't show existing events - this section is only for creating new events
    // The range schedule container will remain empty until user creates events
}

function addRangeEntry() {
    // Prevent multiple rapid clicks
    const addButton = document.querySelector('button[onclick="addRangeEntry()"]');
    if (addButton && addButton.disabled) {
        return; // Already processing
    }
    if (addButton) {
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
    }
    
    const startDate = document.getElementById('rangeStartDate').value;
    const endDate = document.getElementById('rangeEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add Event to All Weekdays';
        }
        return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before or equal to end date');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add Event to All Weekdays';
        }
        return;
    }
    
    const weekdays = getWeekdaysInRange(startDate, endDate);
    
    if (weekdays.length === 0) {
        alert('No weekdays found in the selected date range');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add Event to All Weekdays';
        }
        return;
    }
    
    // Get values from the form
    const grade = document.getElementById('rangeGrade').value;
    const startTime = document.getElementById('rangeStartTime').value;
    const endTime = document.getElementById('rangeEndTime').value;
    const subject = document.getElementById('rangeSubject').value;
    
    // Validate time
    if (startTime >= endTime) {
        alert('Start time must be before end time');
        if (addButton) {
            addButton.disabled = false;
            addButton.textContent = 'Add Event to All Weekdays';
        }
        return;
    }
    
    const newEntry = {
        grade: grade,
        startTime: startTime,
        endTime: endTime,
        subject: subject
    };
    
    // Check for duplicates and add the entry to all weekdays in the range
    let addedCount = 0;
    let skippedCount = 0;
    const skippedWeekdays = [];
    
    weekdays.forEach(weekday => {
        if (!schedule.weekdays[weekday]) {
            schedule.weekdays[weekday] = [];
        }
        
        // Check if an identical event already exists for this weekday
        const isDuplicate = schedule.weekdays[weekday].some(existingEvent => 
            existingEvent.grade === newEntry.grade &&
            existingEvent.startTime === newEntry.startTime &&
            existingEvent.endTime === newEntry.endTime &&
            existingEvent.subject === newEntry.subject
        );
        
        if (!isDuplicate) {
            schedule.weekdays[weekday].push({...newEntry});
            addedCount++;
        } else {
            skippedCount++;
            skippedWeekdays.push(weekday);
        }
    });
    
    // Only save if at least one event was added
    if (addedCount > 0) {
        saveSchedule();
    }
    
    // Hide the form and show success message
    hideRangeEventForm();
    
    // Re-enable the button
    if (addButton) {
        addButton.disabled = false;
        addButton.textContent = 'Add Event to All Weekdays';
    }
    
    // Show appropriate message based on results
    if (skippedCount > 0) {
        alert(`Event added to ${addedCount} weekdays: ${weekdays.filter(day => !skippedWeekdays.includes(day)).join(', ')}\n\nSkipped ${skippedCount} weekdays where identical events already exist: ${skippedWeekdays.join(', ')}`);
    } else {
        alert(`Event added to ${addedCount} weekdays: ${weekdays.join(', ')}`);
    }
}

function showRangeEventForm() {
    const startDate = document.getElementById('rangeStartDate').value;
    const endDate = document.getElementById('rangeEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates first');
        return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before or equal to end date');
        return;
    }
    
    const weekdays = getWeekdaysInRange(startDate, endDate);
    
    if (weekdays.length === 0) {
        alert('No weekdays found in the selected date range');
        return;
    }
    
    // Show the form
    document.getElementById('rangeEventForm').style.display = 'block';
    document.getElementById('showRangeFormBtn').style.display = 'none';
    
    // Reset form values
    document.getElementById('rangeGrade').value = 'None';
    document.getElementById('rangeStartTime').value = '08:00';
    document.getElementById('rangeEndTime').value = '08:45';
    document.getElementById('rangeSubject').value = 'Class';
}

function hideRangeEventForm() {
    document.getElementById('rangeEventForm').style.display = 'none';
    document.getElementById('showRangeFormBtn').style.display = 'block';
}

function cancelRangeEvent() {
    hideRangeEventForm();
}

function createEntryElement(entry, index, type) {
    const div = document.createElement('div');
    div.className = 'schedule-entry';

    // Grade list
    const gradeList = [
        'None',
        'PKA', 'PKB',
        'KA', 'KB',
        'PA', 'PB',
        '1A', '1B', 
        '2A', '2B', 
        '3A', '3B', 
        '4A', '4B', 
        '5A', '5B', 
        '6A', '6B',
        '7A',
        '8A',
        '9A', 
        '10A', 
        '11A', 
        '12A',
        'DC1A', 'DC1B',
        'DC2A', 'DC2B',
        'DC3A', 'DC3B',
        'DC1',
        'DC2',
        'DC3'
    ]
    
    // Grade selection
    const gradeSelect = document.createElement('div');
    gradeSelect.className = 'form-group';
    const gradeOptions = gradeList.map(grade => {
        const isSelected = grade === entry.grade;  // Direct equality comparison
        return `<option value="${grade}" ${isSelected ? 'selected' : ''}>${grade}</option>`;
    }).join('');
    gradeSelect.innerHTML = `
        <label>Grade:</label>
        <select onchange="updateEntry('${type}', ${index}, 'grade', this.value)">
            ${gradeOptions}
        </select>
    `;

    // Start time
    const startTime = document.createElement('div');
    startTime.className = 'form-group';
    startTime.innerHTML = `
        <label>Start Time:</label>
        <input type="time" value="${padTime(entry.startTime)}" 
               onchange="updateEntry('${type}', ${index}, 'startTime', this.value)">
    `;

    // End time
    const endTime = document.createElement('div');
    endTime.className = 'form-group';
    endTime.innerHTML = `
        <label>End Time:</label>
        <input type="time" value="${padTime(entry.endTime)}" 
               onchange="updateEntry('${type}', ${index}, 'endTime', this.value)">
    `;

    // Update the subject options generation to use SUBJECT_OPTIONS
    const subject = document.createElement('div');
    subject.className = 'form-group';
    const subjectOptionsList = SUBJECT_OPTIONS.map(option => {
        const isSelected = option === entry.subject;
        return `<option value="${option}" ${isSelected ? 'selected' : ''}>${option}</option>`;
    }).join('');
    subject.innerHTML = `
        <label>Subject:</label>
        <select onchange="updateEntry('${type}', ${index}, 'subject', this.value)">
            ${subjectOptionsList}
        </select>
    `;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'entry-controls';
    controls.innerHTML = `
        <button class="delete" onclick="deleteEntry('${type}', ${index})">Delete</button>
    `;

    div.appendChild(gradeSelect);
    div.appendChild(startTime);
    div.appendChild(endTime);
    div.appendChild(subject);
    div.appendChild(controls);

    return div;
}

function updateEntry(type, index, field, value) {
    let day, entries;
    
    if (type === 'weekday') {
        day = document.getElementById('weekday').value;
        entries = schedule.weekdays[day];
    } else if (type === 'specific') {
        day = document.getElementById('specificDate').value;
        entries = schedule.specific_dates[day];
    } else if (type === 'range') {
        // For range entries, we need to update all weekdays in the current range
        const startDate = document.getElementById('rangeStartDate').value;
        const endDate = document.getElementById('rangeEndDate').value;
        const weekdays = getWeekdaysInRange(startDate, endDate);
        
        weekdays.forEach(weekday => {
            if (schedule.weekdays[weekday] && schedule.weekdays[weekday][index]) {
                schedule.weekdays[weekday][index][field] = value;
                if (field === 'subject' && value === 'Class') {
                    schedule.weekdays[weekday][index].subject = `Class ${schedule.weekdays[weekday][index].grade.split(' ')[1] || ''}`;
                }
            }
        });
        saveSchedule();
        return;
    }
    
    if (entries && entries[index]) {
        entries[index][field] = value;
        if (field === 'subject' && value === 'Class') {
            entries[index].subject = `Class ${entries[index].grade.split(' ')[1] || ''}`;
        }
        saveSchedule();
    }
}

function deleteEntry(type, index) {
    if (type === 'range') {
        // For range entries, we need to delete from all weekdays in the current range
        const startDate = document.getElementById('rangeStartDate').value;
        const endDate = document.getElementById('rangeEndDate').value;
        const weekdays = getWeekdaysInRange(startDate, endDate);
        
        weekdays.forEach(weekday => {
            if (schedule.weekdays[weekday] && schedule.weekdays[weekday][index]) {
                schedule.weekdays[weekday].splice(index, 1);
                if (schedule.weekdays[weekday].length === 0) {
                    delete schedule.weekdays[weekday];
                }
            }
        });
        
        saveSchedule();
        return;
    }
    
    const day = type === 'weekday' ? document.getElementById('weekday').value 
                                 : document.getElementById('specificDate').value;
    const entries = type === 'weekday' ? schedule.weekdays[day] 
                                     : schedule.specific_dates[day];
    
    if (entries && entries[index]) {
        entries.splice(index, 1);
        if (entries.length === 0) {
            if (type === 'weekday') {
                delete schedule.weekdays[day];
            } else {
                delete schedule.specific_dates[day];
            }
        }
        if (type === 'weekday') {
            updateWeekdaySchedule();
        } else {
            updateSpecificSchedule();
        }
        saveSchedule();
    }
}

// ===== Import From Image via OpenAI endpoint =====
let extractedSchedule = null;

function initImportTab() {
	const fileInput = document.getElementById('scheduleImage');
	const extractBtn = document.getElementById('extractBtn');
	const applyBtn = document.getElementById('applyExtractedBtn');
	const preview = document.getElementById('previewImage');
	const progress = document.getElementById('ocrProgress');
	const jsonEl = document.getElementById('extractedJson');
	if (!fileInput || !extractBtn) return;

	extractBtn.addEventListener('click', async () => {
		if (!fileInput.files || !fileInput.files[0]) {
			alert('Please choose a schedule image first.');
			return;
		}
		const img = fileInput.files[0];
		preview.style.display = 'block';
		preview.src = URL.createObjectURL(img);
		progress.textContent = 'Uploading image...';
		jsonEl.style.display = 'none';
		if (applyBtn) applyBtn.disabled = true;

		const form = new FormData();
		form.append('image', img);
		try {
			const resp = await fetch('/api/schedule/extract', { method: 'POST', body: form });
			if (!resp.ok) throw new Error('Extraction failed');
			const data = await resp.json();
			extractedSchedule = data;
			jsonEl.textContent = JSON.stringify(data, null, 2);
			jsonEl.style.display = 'block';
			progress.textContent = 'Extraction complete. Review and Apply.';
			if (applyBtn) applyBtn.disabled = false;
		} catch (e) {
			console.error(e);
			progress.textContent = 'Extraction failed. Please try another image.';
		}
	});

	if (applyBtn) {
		applyBtn.addEventListener('click', async () => {
			if (!extractedSchedule) return;
			schedule = extractedSchedule;
			await saveSchedule();
			window.location.href = 'index.html';
		});
	}
}

// ===== Image Upload and Schedule Extraction =====
async function extractScheduleFromImage() {
    const fileInput = document.getElementById('imageUpload');
    const preview = document.getElementById('imagePreview');
    
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please choose a schedule image first.');
        return;
    }
    
    const img = fileInput.files[0];
    
    // Show preview
    preview.innerHTML = `
        <h4>Image Preview:</h4>
        <img src="${URL.createObjectURL(img)}" style="max-width: 100%; height: auto;" />
        <p>Processing image...</p>
    `;
    
    const form = new FormData();
    form.append('image', img);
    
    try {
        const headers = supabaseAuth.getAuthHeaders();
        // Remove Content-Type header for FormData
        delete headers['Content-Type'];
        
        const response = await fetch('/api/schedule/extract', {
            method: 'POST',
            headers: headers,
            body: form
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showAuth();
                return;
            }
            throw new Error('Failed to extract schedule');
        }
        
        const extractedData = await response.json();
        
        // Show extracted data
        preview.innerHTML = `
            <h4>Image Preview:</h4>
            <img src="${URL.createObjectURL(img)}" style="max-width: 100%; height: auto;" />
            <h4>Extracted Schedule:</h4>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;">${JSON.stringify(extractedData, null, 2)}</pre>
            <button onclick="applyExtractedSchedule(${JSON.stringify(extractedData).replace(/"/g, '&quot;')})" class="save-btn">Apply & Save</button>
        `;
        
    } catch (error) {
        console.error('Error extracting schedule:', error);
        preview.innerHTML = `
            <h4>Image Preview:</h4>
            <img src="${URL.createObjectURL(img)}" style="max-width: 100%; height: auto;" />
            <p style="color: red;">Error: ${error.message}</p>
        `;
    }
}

function applyExtractedSchedule(extractedData) {
    if (extractedData.weekdays) {
        schedule.weekdays = { ...schedule.weekdays, ...extractedData.weekdays };
    }
    if (extractedData.specific_dates) {
        schedule.specific_dates = { ...schedule.specific_dates, ...extractedData.specific_dates };
    }
    
    // Update the UI
    updateWeekdaySchedule();
    updateSpecificSchedule();
    
    // Save the schedule
    saveSchedule();
    
    // Show success message
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <h4>Schedule Applied Successfully!</h4>
        <p>The extracted schedule has been applied and saved.</p>
    `;
}

document.addEventListener('DOMContentLoaded', initApp);