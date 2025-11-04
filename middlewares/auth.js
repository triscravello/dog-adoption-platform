const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) {
    console.error("JWT_SECRET not set in .env");
    process.exit(1);
}

async function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header '});
        }
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET);
        // Attach user to request (fetch fresh from DB to ensure accuracy)
        const user = await User.findById(payload.id).select('-passwordHash');
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error', err);
        return res.status(401).json({ error: 'Invalid or expired token '});
    }
}

module.exports = { requireAuth };