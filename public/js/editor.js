let schedule = {
    weekdays: {},
    specific_dates: {}
};

function padTime(timeStr) {
    const [h, m] = timeStr.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

// Load initial schedule
fetch('/api/schedule')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        schedule = data || { weekdays: {}, specific_dates: {} };
        updateWeekdaySchedule();
    })
    .catch(error => {
        console.error('Error loading schedule:', error);
        schedule = { weekdays: {}, specific_dates: {} };
        updateWeekdaySchedule();
    });


// Function to save schedule changes
async function saveSchedule() {
    try {
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schedule)
        });

        if (!response.ok) {
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
        '6A',
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

    // Subject
    const subject = document.createElement('div');
    subject.className = 'form-group';
    subject.innerHTML = `
        <label>Subject:</label>
        <select onchange="updateEntry('${type}', ${index}, 'subject', this.value)">
            <option value="Class" ${entry.subject === 'Class' ? 'selected' : ''}>Class</option>
            <option value="Recess" ${entry.subject === 'Recess' ? 'selected' : ''}>Recess</option>
            <option value="Lunch" ${entry.subject === 'Lunch' ? 'selected' : ''}>Lunch</option>
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
    const day = type === 'weekday' ? document.getElementById('weekday').value 
                                 : document.getElementById('specificDate').value;
    const entries = type === 'weekday' ? schedule.weekdays[day] 
                                     : schedule.specific_dates[day];
    
    if (entries && entries[index]) {
        entries[index][field] = value;
        if (field === 'subject' && value === 'Class') {
            entries[index].subject = `Class ${entries[index].grade.split(' ')[1] || ''}`;
        }
        saveSchedule();
    }
}

function deleteEntry(type, index) {
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