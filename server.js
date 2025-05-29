const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const databaseService = require('./api/services/databaseService');
const { courseRoutes } = require('./api/routes/courseRoutes');
const { chartRoutes } = require('./api/routes/chartRoutes');
const { simulationRoutes } = require('./api/routes/simulationRoutes');
const { errorHandler } = require('./api/middleware/errorHandler');
const { coursesData } = require('./api/models/courseModel');

const app = express();
const PORT = process.env.PORT || 5000; // Changed from 3000 to 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false, // Allow embedding
}));

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// Parse JSON with increased limit
app.use(express.json({ limit: '10mb' })); // For handling JSON and large images
app.use(express.urlencoded({ extended: true }));

// Disable caching for all routes
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Debug endpoint to check courses
app.get('/api/debug/courses', (req, res) => {
  res.json({
    count: coursesData.courses.length,
    ids: coursesData.courses.map(c => c.id),
    courses: coursesData.courses
  });
});

// API routes
app.use('/api/courses', courseRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/simulation', simulationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: databaseService.isReady() ? 'connected' : 'disconnected'
  });
});

// Add monitoring routes
app.get('/api/monitoring/status', (req, res) => {
  res.json({
    monitoringEnabled: process.env.ENABLE_MONITORING === 'true',
    monitoringPort: process.env.MONITORING_PORT || 3001
  });
});

// Add admin route to get monitored users
app.get('/api/admin/monitored-users', async (req, res) => {
  try {
    if (process.env.ENABLE_MONITORING !== 'true') {
      return res.status(503).json({ message: 'Monitoring service not enabled' });
    }
    
    const axios = require('axios');
    const response = await axios.get('http://localhost:3001/api/users/monitored', {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching monitored users:', error);
    res.status(500).json({ message: 'Error fetching monitored users' });
  }
});

// Error handling middleware
app.use(errorHandler);

// Initialize database
const initializeDatabase = async () => {
  try {
    if (process.env.USE_DATABASE === 'true') {
      await databaseService.initialize();
      console.log('✅ Database initialized successfully');
      return true;
    } else {
      console.log('📝 Running in memory mode (database disabled)');
      return true;
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.warn('⚠️ Database initialization failed. Running in fallback mode.');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Database mode: ${process.env.USE_DATABASE === 'true' ? 'Enabled' : 'Disabled'}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
      console.log(`📈 Health check: http://localhost:${PORT}/api/health`);
      if (process.env.ENABLE_MONITORING === 'true') {
        console.log(`🔍 Monitoring system running on port ${process.env.MONITORING_PORT || 3001}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await databaseService.close();
  process.exit(0);
});

startServer();
