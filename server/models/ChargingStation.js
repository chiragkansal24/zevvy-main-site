const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String,
        required: true
    },
    power_kw: {
        type: Number,
        required: true
    },
    connectorTypes: {
        type: [String],
        required: true
    },
    chargingStops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChargingStop'
    }]
}, {
    timestamps: true
});

// Create a 2dsphere index for geospatial queries
chargingStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ChargingStation', chargingStationSchema);