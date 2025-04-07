const express = require('express');
const { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse 
} = require('../controllers/courseController');
const { validateCourse } = require('../middleware/validation');
const { simulationService } = require('../services/simulationService');
const { addClient, sendEventToClient } = require('../services/eventService');

const router = express.Router();

// Server-Sent Events endpoint for real-time updates
router.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send an initial connection message
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
  
  // Add this client to our set
  const removeClient = addClient(res);
  
  // Add a simulation listener for automatic updates
  const simulationListener = (event) => {
    sendEventToClient(res, 'courseUpdated', event);
  };
  
  simulationService.addListener(simulationListener);
  
  // Remove client and listener when the connection closes
  req.on('close', () => {
    removeClient();
    simulationService.removeListener(simulationListener);
  });
});

// GET all courses with optional filtering and sorting
router.get('/', getCourses);

// GET a specific course by ID
router.get('/:id', getCourseById);

// POST a new course with validation
router.post('/', validateCourse, createCourse);

// PUT/update a course with validation
router.put('/:id', validateCourse, updateCourse);

// DELETE a course
router.delete('/:id', deleteCourse);

module.exports = { courseRoutes: router };
