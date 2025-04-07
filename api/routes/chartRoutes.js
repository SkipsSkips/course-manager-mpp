const express = require('express');
const { chartService } = require('../services/chartService');

const router = express.Router();

// Get all chart data in one call
router.get('/', (req, res) => {
  try {
    const chartData = chartService.getAllChartData();
    res.json(chartData);
  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({ message: 'Error retrieving chart data' });
  }
});

// Get category distribution
router.get('/category-distribution', (req, res) => {
  try {
    const data = chartService.getCategoryDistribution();
    res.json(data);
  } catch (error) {
    console.error('Error getting category distribution:', error);
    res.status(500).json({ message: 'Error retrieving category distribution' });
  }
});

// Get price distribution
router.get('/price-distribution', (req, res) => {
  try {
    const data = chartService.getPriceDistribution();
    res.json(data);
  } catch (error) {
    console.error('Error getting price distribution:', error);
    res.status(500).json({ message: 'Error retrieving price distribution' });
  }
});

// Get average lessons per category
router.get('/lessons-per-category', (req, res) => {
  try {
    const data = chartService.getAverageLessonsPerCategory();
    res.json(data);
  } catch (error) {
    console.error('Error getting lessons per category:', error);
    res.status(500).json({ message: 'Error retrieving lessons per category' });
  }
});

module.exports = { chartRoutes: router };
