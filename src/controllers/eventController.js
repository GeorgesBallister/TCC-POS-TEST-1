const dbService = require('../services/databaseService');
const scraperService = require('../services/scraperService');

// Get all events
const getEvents = async (req, res) => {
    try {
        const events = await dbService.readEvents();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve events.' });
    }
};

// Trigger manual scrape
const triggerScrape = async (req, res) => {
    try {
        await scraperService.scrapeEvents();
        const events = await dbService.readEvents();
        res.json({ message: 'Scrape successful', data: events });
    } catch (error) {
        res.status(500).json({ error: 'Scraping failed.' });
    }
};

// Toggle "Saved" status
const toggleSave = async (req, res) => {
    const { id } = req.params;
    try {
        const events = await dbService.readEvents();
        const eventIndex = events.findIndex(e => e.id === id);
        
        if (eventIndex !== -1) {
            // Toggle boolean
            events[eventIndex].saved = !events[eventIndex].saved;
            await dbService.saveEvents(events);
            res.json(events[eventIndex]);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};

module.exports = { getEvents, triggerScrape, toggleSave };