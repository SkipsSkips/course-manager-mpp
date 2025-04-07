const express = require('express');
const { simulationService } = require('../services/simulationService');

const router = express.Router();

// Start the simulation
router.post('/start', (req, res) => {
  const result = simulationService.start();
  res.json(result);
});

// Stop the simulation
router.post('/stop', (req, res) => {
  const result = simulationService.stop();
  res.json(result);
});

// Get simulation status
router.get('/status', (req, res) => {
  const status = simulationService.getStatus();
  res.json(status);
});

module.exports = { simulationRoutes: router };
