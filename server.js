const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('./'));

// GET endpoint to read schedule
app.get('/api/schedule', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'js', 'schedule.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading schedule:', error);
        res.status(500).json({ error: 'Failed to read schedule' });
    }
});

// POST endpoint to save schedule
app.post('/api/schedule', async (req, res) => {
    try {
        const schedule = req.body;
        await fs.writeFile(
            path.join(__dirname, 'js', 'schedule.json'),
            JSON.stringify(schedule, null, 2),
            'utf8'
        );
        res.json({ message: 'Schedule saved successfully' });
    } catch (error) {
        console.error('Error saving schedule:', error);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});