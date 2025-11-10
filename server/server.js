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

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Basic public endpoints
app.get('/', (_req, res) => res.send('Zevvy API (backend)'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Public auth routes
app.use('/api/users', userRoutes);

// Protected routes (apply auth only where needed)
app.use('/api/chargers', authMiddleware, chargerRoutes);
app.use('/api/geocode', authMiddleware, geocodeRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);

// Start server regardless of DB status so platform health checks succeed
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);

    if (!MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI not set. DB features disabled until environment is configured.');
        return;
    }

    mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('✅ MongoDB connected'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
});

// prevent crashes from uncaught errors
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));