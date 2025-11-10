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

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check (useful for Render)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routes
// Public routes first (login/register)
app.use('/api/users', userRoutes);

// Protected routes
app.use('/api/chargers', authMiddleware, chargerRoutes);
app.use('/api/geocode', authMiddleware, geocodeRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);

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