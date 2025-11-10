const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const chargerRoutes = require('./routes/chargers');
const geocodeRoutes = require('./routes/geocode');
const reviewRoutes = require('./routes/reviews');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/reviews', reviewRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });