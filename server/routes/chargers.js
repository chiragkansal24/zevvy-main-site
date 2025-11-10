const express = require('express');
const router = express.Router();
const ChargingStation = require('../models/ChargingStation');
const { authenticate } = require('../middleware/auth');

// Get nearby charging stations
router.get('/nearby', authenticate, async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    try {
        const stations = await ChargingStation.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], 25 / 3963.2] // 25 km radius
                }
            }
        });

        res.json(stations);
    } catch (error) {
        console.error('Error fetching nearby stations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new charging station
router.post('/', authenticate, async (req, res) => {
    const { name, address, location } = req.body;

    if (!name || !address || !location) {
        return res.status(400).json({ error: 'Name, address, and location are required.' });
    }

    try {
        const newStation = new ChargingStation({
            name,
            address,
            location
        });

        await newStation.save();
        res.status(201).json(newStation);
    } catch (error) {
        console.error('Error adding charging station:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific charging station by ID
router.get('/:id', async (req, res) => {
    try {
        const station = await ChargingStation.findById(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Charging station not found' });
        }
        res.json(station);
    } catch (error) {
        console.error('Error fetching charging station:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a charging station
router.put('/:id', authenticate, async (req, res) => {
    try {
        const updatedStation = await ChargingStation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStation) {
            return res.status(404).json({ error: 'Charging station not found' });
        }
        res.json(updatedStation);
    } catch (error) {
        console.error('Error updating charging station:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a charging station
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const deletedStation = await ChargingStation.findByIdAndDelete(req.params.id);
        if (!deletedStation) {
            return res.status(404).json({ error: 'Charging station not found' });
        }
        res.json({ message: 'Charging station deleted successfully' });
    } catch (error) {
        console.error('Error deleting charging station:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;