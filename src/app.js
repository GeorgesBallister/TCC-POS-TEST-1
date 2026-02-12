const express = require('express');
const cors = require('cors');
const path = require('path');
const eventController = require('./controllers/eventController');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/api/events', eventController.getEvents);
app.post('/api/scrape', eventController.triggerScrape);
app.post('/api/events/:id/toggle-save', eventController.toggleSave);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: NodeJS MVP for Recife Events`);
});