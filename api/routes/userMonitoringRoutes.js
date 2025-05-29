const express = require('express');
const router = express.Router();
const { userMonitoringController } = require('../controllers/userMonitoringController');

// Session management routes
router.get('/sessions/active', userMonitoringController.getActiveSessions);
router.get('/sessions/:sessionId', userMonitoringController.getSessionDetails);
router.delete('/sessions/:sessionId', userMonitoringController.terminateSession);

// User activity routes
router.get('/activity/recent', userMonitoringController.getRecentActivity);
router.get('/activity/user/:userId', userMonitoringController.getUserActivity);
router.post('/activity/track', userMonitoringController.trackActivity);

// Analytics routes
router.get('/analytics/overview', userMonitoringController.getAnalyticsOverview);
router.get('/analytics/page-views', userMonitoringController.getPageViewAnalytics);
router.get('/analytics/user-engagement', userMonitoringController.getUserEngagement);
router.get('/analytics/real-time', userMonitoringController.getRealTimeMetrics);

// Performance monitoring
router.get('/performance/metrics', userMonitoringController.getPerformanceMetrics);
router.post('/performance/report', userMonitoringController.reportPerformance);

// System health
router.get('/health', userMonitoringController.getSystemHealth);

module.exports = { userMonitoringRoutes: router };
