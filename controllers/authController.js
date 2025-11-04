const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
    console.error('JWT_SECRET not set');
    process.exit(1);
}

async function register (req, res) {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required. ' });
        
        const existing = await User.findOne({ username });
        if (existing) return res.status(409).json({ error: 'Username already taken' });

        const user = new User({ username });
        await user.setPassword(password);
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(201).json({ user: user.toJSON(), token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration'} );
    }
};

async function login (req, res) {
     try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password required. ' });

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials '});

        const valid = await user.validatePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials '});

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ user: user.toJSON(), token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login'} );
    }
};

module.exports = { register, login };