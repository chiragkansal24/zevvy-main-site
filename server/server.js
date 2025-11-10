// ...existing code...
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

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// public health route
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// public auth routes
app.use('/api/users', userRoutes);

// protect specific routes only
app.use('/api/chargers', authMiddleware, chargerRoutes);
app.use('/api/geocode', authMiddleware, geocodeRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set'); process.exit(1);
}

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on ${PORT}`));
    })
    .catch(err => { console.error('DB error', err); process.exit(1); });