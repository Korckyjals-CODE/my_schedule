require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const winston = require('winston');
const multer = require('multer');
const OpenAI = require('openai');
const { supabase } = require('./supabase');

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Request parsing
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// OpenAI client configuration
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Multer for image uploads (memory storage)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware to extract user from Supabase JWT
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// API routes
app.get('/api/config', (req, res) => {
    try {
        // Only expose public configuration (no sensitive keys)
        res.json({
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        });
    } catch (error) {
        logger.error('Error providing config:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

app.get('/api/schedule', authenticateUser, async (req, res) => {
    try {
        const { data: schedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (schedules && schedules.length > 0) {
            res.json({
                weekdays: schedules[0].weekdays || {},
                specific_dates: schedules[0].specific_dates || {}
            });
        } else {
            // Return default empty schedule
            res.json({
                weekdays: {},
                specific_dates: {}
            });
        }
    } catch (error) {
        logger.error('Error reading schedule:', error);
        res.status(500).json({ error: 'Failed to read schedule' });
    }
});

app.post('/api/schedule', authenticateUser, async (req, res) => {
    try {
        const schedule = req.body;
        
        // Check if user already has a schedule
        const { data: existingSchedules, error: checkError } = await supabase
            .from('schedules')
            .select('id')
            .eq('user_id', req.user.id)
            .limit(1);

        if (checkError) throw checkError;

        let result;
        if (existingSchedules && existingSchedules.length > 0) {
            // Update existing schedule
            const { data, error } = await supabase
                .from('schedules')
                .update({
                    weekdays: schedule.weekdays || {},
                    specific_dates: schedule.specific_dates || {},
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingSchedules[0].id)
                .select();

            if (error) throw error;
            result = data;
        } else {
            // Create new schedule
            const { data, error } = await supabase
                .from('schedules')
                .insert({
                    user_id: req.user.id,
                    weekdays: schedule.weekdays || {},
                    specific_dates: schedule.specific_dates || {}
                })
                .select();

            if (error) throw error;
            result = data;
        }

        res.json({ message: 'Schedule saved successfully', schedule: result[0] });
    } catch (error) {
        logger.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// Search analytics endpoint (for future dashboard)
app.get('/api/search/analytics', authenticateUser, async (req, res) => {
    try {
        // This would typically query a search analytics table
        // For now, we'll return mock data
        const analytics = {
            totalSearches: 0,
            popularFilters: {
                grades: [],
                subjects: [],
                days: []
            },
            searchTrends: [],
            averageResultsPerSearch: 0
        };
        
        res.json(analytics);
    } catch (error) {
        logger.error('Error getting search analytics:', error);
        res.status(500).json({ error: 'Failed to get search analytics' });
    }
});

// Search schedules endpoint
app.post('/api/search', authenticateUser, async (req, res) => {
    try {
        const searchParams = req.body;
        const {
            searchText = '',
            grades = [],
            subjects = [],
            days = [],
            startTime = '',
            endTime = '',
            page = 1,
            limit = 50
        } = searchParams;

        logger.info('Search request:', { 
            userId: req.user.id, 
            searchParams: { searchText, grades, subjects, days, startTime, endTime, page, limit }
        });

        // Get user's schedule
        const { data: schedules, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!schedules || schedules.length === 0) {
            return res.json({
                results: [],
                totalCount: 0,
                page: 1,
                totalPages: 0,
                hasMore: false
            });
        }

        const schedule = schedules[0];
        const results = performServerSideSearch(schedule, searchParams);
        
        // Pagination
        const totalCount = results.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = results.slice(startIndex, endIndex);

        // Log search analytics
        logSearchAnalytics(req.user.id, searchParams, totalCount);

        res.json({
            results: paginatedResults,
            totalCount,
            page,
            totalPages,
            hasMore: page < totalPages,
            searchParams: {
                searchText,
                grades,
                subjects,
                days,
                startTime,
                endTime
            }
        });

    } catch (error) {
        logger.error('Error in search API:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
});

// Extract schedule from an uploaded image via OpenAI
app.post('/api/schedule/extract', authenticateUser, upload.single('image'), async (req, res) => {
	try {
		if (!openai) {
			return res.status(500).json({ error: 'OpenAI not configured' });
		}
		if (!req.file) {
			return res.status(400).json({ error: 'No image uploaded' });
		}

		// Get prompt from environment variable instead of file
		const prompt = process.env.SCHEDULE_EXTRACTION_PROMPT || `You are given an image of a school schedule grid with days as rows (Monday–Friday) and time slots as columns.
Extract the schedule into the following strict JSON schema. Return ONLY valid JSON, no extra text.

Schema:
{
  "weekdays": {
    "Monday": [ { "grade": "string", "startTime": "HH:MM", "endTime": "HH:MM", "subject": "string" } ],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": []
  },
  "specific_dates": {}
}

Rules:
- Time format: 24-hour HH:MM with leading zeros.
- For non-class blocks, use subject in {"Recess","Lunch","Assembly","Home Room","Dismissal","Other"} and set "grade" to "".
- For class blocks, set subject to "Class" and put the class label (e.g., "6A","11A","DC3A") in "grade".
- If a cell is empty, omit it.
- Use the time windows printed in the header row as the canonical intervals.
- If the image shows colored recess/lunch/assembly columns, map them accordingly even if not labeled.
- Do not infer specific_dates unless the image explicitly contains a date; leave "specific_dates" as {} otherwise.
- Return compact but valid JSON per the schema.`;

		const mime = req.file.mimetype || 'image/png';
		const base64 = req.file.buffer.toString('base64');
		const imageUrl = `data:${mime};base64,${base64}`;

		const completion = await openai.chat.completions.create({
			model: openaiModel,
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: prompt },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'Extract the schedule JSON from this image.' },
						{ type: 'image_url', image_url: { url: imageUrl } }
					]
				}
			]
		});

		const content = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content ? completion.choices[0].message.content : '{}';
		let json;
		try {
			json = JSON.parse(content);
		} catch (e) {
			return res.status(502).json({ error: 'Model did not return valid JSON', raw: content });
		}
		return res.json(json);
	} catch (error) {
		logger.error('Error extracting schedule:', error);
		res.status(500).json({ error: 'Failed to extract schedule' });
	}
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Server-side search logic
function performServerSideSearch(schedule, searchParams) {
    const { searchText, grades, subjects, days, startTime, endTime } = searchParams;
    const results = [];
    
    // Search through weekdays
    if (schedule.weekdays) {
        Object.entries(schedule.weekdays).forEach(([day, events]) => {
            if (events && Array.isArray(events)) {
                events.forEach((event, index) => {
                    if (matchesServerFilters(event, day, null, searchParams)) {
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
    }
    
    // Search through specific dates
    if (schedule.specific_dates) {
        Object.entries(schedule.specific_dates).forEach(([date, events]) => {
            if (events && Array.isArray(events)) {
                events.forEach((event, index) => {
                    const day = getWeekDayFromDate(date);
                    if (matchesServerFilters(event, day, date, searchParams)) {
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
    }
    
    // Sort results by day and time
    return results.sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const aDayIndex = dayOrder.indexOf(a.day);
        const bDayIndex = dayOrder.indexOf(b.day);
        
        if (aDayIndex !== bDayIndex) {
            return aDayIndex - bDayIndex;
        }
        
        return convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
    });
}

// Server-side filter matching
function matchesServerFilters(event, day, date, searchParams) {
    const { searchText, grades, subjects, days, startTime, endTime } = searchParams;
    
    // Text search
    if (searchText) {
        const searchLower = searchText.toLowerCase().trim();
        if (searchLower) {
            const eventText = `${event.grade || ''} ${event.subject || ''} ${event.startTime || ''} ${event.endTime || ''} ${day || ''}`.toLowerCase();
            if (!eventText.includes(searchLower)) {
                return false;
            }
        }
    }
    
    // Grade filter
    if (grades.length > 0) {
        const eventGrade = event.grade || '';
        if (!grades.includes(eventGrade)) {
            return false;
        }
    }
    
    // Subject filter
    if (subjects.length > 0) {
        const eventSubject = event.subject || '';
        if (!subjects.includes(eventSubject)) {
            return false;
        }
    }
    
    // Day filter
    if (days.length > 0) {
        if (!days.includes(day)) {
            return false;
        }
    }
    
    // Time filter
    if (startTime || endTime) {
        const eventStart = convertTimeToMinutes(event.startTime);
        const eventEnd = convertTimeToMinutes(event.endTime);
        
        if (startTime) {
            const filterStart = convertTimeToMinutes(startTime);
            if (eventStart < filterStart) {
                return false;
            }
        }
        
        if (endTime) {
            const filterEnd = convertTimeToMinutes(endTime);
            if (eventEnd > filterEnd) {
                return false;
            }
        }
    }
    
    return true;
}

// Helper functions
function getWeekDayFromDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function convertTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Search analytics logging
function logSearchAnalytics(userId, searchParams, resultCount) {
    const analyticsData = {
        userId,
        timestamp: new Date().toISOString(),
        searchParams: {
            searchText: searchParams.searchText,
            gradesCount: searchParams.grades?.length || 0,
            subjectsCount: searchParams.subjects?.length || 0,
            daysCount: searchParams.days?.length || 0,
            hasTimeFilter: !!(searchParams.startTime || searchParams.endTime)
        },
        resultCount,
        hasResults: resultCount > 0
    };
    
    logger.info('Search analytics:', analyticsData);
    
    // In a production environment, you might want to store this in a database
    // or send to an analytics service like Google Analytics, Mixpanel, etc.
}

// Start server
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});