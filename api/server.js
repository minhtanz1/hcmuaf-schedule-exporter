// api/server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ical = require('ical-generator');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true // Allow cookies
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files from 'public' directory
app.use(cookieParser());

// Import route modules
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const examRoutes = require('./routes/exam');
const icsRoutes = require('./routes/ics');

// Define base route path
const routePrefix = '/api';

// Mount routes
app.use(routePrefix, authRoutes);
app.use(routePrefix, scheduleRoutes);
app.use(routePrefix, examRoutes);
app.use(routePrefix, icsRoutes);
// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});