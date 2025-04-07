const express = require('express');
const path = require('path');
const { courseRoutes } = require('./api/routes/courseRoutes');
const { chartRoutes } = require('./api/routes/chartRoutes');
const { simulationRoutes } = require('./api/routes/simulationRoutes');
const { errorHandler } = require('./api/middleware/errorHandler');
const { coursesData } = require('./api/models/courseModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'my-app/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'my-app', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// For graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down');
  process.exit(0);
});
