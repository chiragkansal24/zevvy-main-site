const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Submit a new review
router.post('/add', auth, async (req, res) => {
    const { rating, reviewText, chargingStationId } = req.body;

    try {
        const review = new Review({
            user: req.user.id,
            chargingStation: chargingStationId,
            rating,
            reviewText
        });
        await review.save();
        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Edit an existing review
router.put('/:id', auth, async (req, res) => {
    const { rating, reviewText } = req.body;

    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to edit this review' });
        }

        review.rating = rating;
        review.reviewText = reviewText;
        await review.save();
        res.json({ message: 'Review updated successfully', review });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update review' });
    }
});

// Fetch reviews for a charging station
router.get('/:chargingStationId', async (req, res) => {
    try {
        const reviews = await Review.find({ chargingStation: req.params.chargingStationId }).populate('user', 'username');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Fetch user's reviews
router.get('/user', auth, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id }).populate('chargingStation');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
});

module.exports = router;