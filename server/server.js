const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const userRoutes = require('./routes/users');
const chargerRoutes = require('./routes/chargers');
const geocodeRoutes = require('./routes/geocode');
const reviewRoutes = require('./routes/reviews');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Public health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Public routes (no auth)
app.use('/api/users', userRoutes);

// Protected routes (auth applied per-route)
app.use('/api/chargers', authMiddleware, chargerRoutes);
app.use('/api/geocode', authMiddleware, geocodeRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);

// DB + server
if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
    })
    .catch((err) => {
        console.error('DB connection error:', err);
        process.exit(1);
    });