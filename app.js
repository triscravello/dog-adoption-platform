const express = require("express");
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const dogRoutes = require('./routes/dogs');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors()); // enable CORS
app.use(express.json()); // parse JSON bodies

// routes 
app.use('/auth', authRoutes);
app.use('/dogs', dogRoutes);

// health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// connect DB and start server
connectDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to start server', err);
        process.exit(1);
    });

module.exports = app; // exporting for testing