const jwt = require('jsonwebtoken');
const { getAuthToken } = require('../utils/auth'); // Assuming you have a utility function to get the token

const authMiddleware = (req, res, next) => {
    const token = getAuthToken(req);
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded; // Attach user info to request object
        next();
    });
};

module.exports = authMiddleware;