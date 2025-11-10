const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Geocode endpoint to convert addresses to coordinates
router.get('/geocode', async (req, res) => {
    const { address } = req.query;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const { center } = data.features[0];
            return res.json({ lng: center[0], lat: center[1] });
        } else {
            return res.status(404).json({ error: 'Location not found' });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;