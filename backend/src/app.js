const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

// Middlewares
const errorHandler = require('./middleware/error');

// Sockets Setup
const initSockets = require('./sockets');

// Feature Module Routers
const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/project.routes');
const eventRoutes = require('./modules/events/event.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const app = express();
const server = http.createServer(app);

// Initialize Sockets and bind to app
const io = initSockets(server);
app.set('io', io);

// Basic Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic Tracker redirection (convenient URL for tracking script embeds)
app.use('/tracker.js', (req, res, next) => {
  req.url = '/api/events/tracker.js';
  next();
});

// Mounting Module API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Central Error Handling
app.use(errorHandler);

// Database connection & Server Bootup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pulse_analytics';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Database.');
    server.listen(PORT, () => {
      console.log(`Pulse Analytics server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
