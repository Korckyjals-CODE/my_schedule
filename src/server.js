require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const winston = require('winston');

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
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Request parsing
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.get('/api/schedule', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/schedule.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        logger.error('Error reading schedule:', error);
        res.status(500).json({ error: 'Failed to read schedule' });
    }
});

app.post('/api/schedule', async (req, res) => {
    try {
        const schedule = req.body;
        await fs.writeFile(
            path.join(__dirname, '../data/schedule.json'),
            JSON.stringify(schedule, null, 2),
            'utf8'
        );
        res.json({ message: 'Schedule saved successfully' });
    } catch (error) {
        logger.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});