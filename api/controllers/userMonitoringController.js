const { v4: uuidv4 } = require('uuid');

// In-memory storage for demonstration (replace with database in production)
const activeSessions = new Map();
const activityLog = [];
const performanceMetrics = [];

const userMonitoringController = {
  // Session Management
  getActiveSessions: (req, res) => {
    try {
      const sessions = Array.from(activeSessions.values()).map(session => ({
        sessionId: session.sessionId,
        userId: session.userId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        pageViews: session.pageViews.length,
        currentPage: session.currentPage
      }));

      res.json({
        totalSessions: sessions.length,
        sessions: sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching active sessions', error: error.message });
    }
  },

  getSessionDetails: (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching session details', error: error.message });
    }
  },

  terminateSession: (req, res) => {
    try {
      const { sessionId } = req.params;
      
      if (activeSessions.delete(sessionId)) {
        res.json({ message: 'Session terminated successfully' });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error terminating session', error: error.message });
    }
  },

  // Activity Tracking
  getRecentActivity: (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const recentActivity = activityLog
        .slice(-limit)
        .reverse()
        .map(activity => ({
          timestamp: activity.timestamp,
          sessionId: activity.sessionId,
          userId: activity.userId,
          action: activity.action,
          page: activity.page,
          details: activity.details
        }));

      res.json({
        totalActivities: activityLog.length,
        recentActivity
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
    }
  },

  getUserActivity: (req, res) => {
    try {
      const { userId } = req.params;
      const userActivities = activityLog.filter(activity => activity.userId === userId);

      res.json({
        userId,
        totalActivities: userActivities.length,
        activities: userActivities.reverse()
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user activity', error: error.message });
    }
  },

  trackActivity: (req, res) => {
    try {
      const { sessionId, userId, action, page, details } = req.body;
      
      const activity = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sessionId,
        userId,
        action,
        page,
        details: details || {}
      };

      activityLog.push(activity);

      // Update session if it exists
      const session = activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = activity.timestamp;
        session.currentPage = page;
        session.pageViews.push({
          page,
          timestamp: activity.timestamp,
          action
        });
      }

      res.status(201).json({ message: 'Activity tracked successfully', activityId: activity.id });
    } catch (error) {
      res.status(500).json({ message: 'Error tracking activity', error: error.message });
    }
  },

  // Analytics
  getAnalyticsOverview: (req, res) => {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentActivities = activityLog.filter(activity => 
        new Date(activity.timestamp) >= last24Hours
      );

      const weeklyActivities = activityLog.filter(activity => 
        new Date(activity.timestamp) >= last7Days
      );

      const uniqueUsers24h = new Set(recentActivities.map(a => a.userId)).size;
      const uniqueUsersWeek = new Set(weeklyActivities.map(a => a.userId)).size;

      const pageViews = recentActivities.filter(a => a.action === 'page_view').length;
      const courseViews = recentActivities.filter(a => a.action === 'course_view').length;

      res.json({
        overview: {
          activeSessions: activeSessions.size,
          totalUsers: new Set(activityLog.map(a => a.userId)).size,
          uniqueUsers24h,
          uniqueUsersWeek,
          totalActivities: activityLog.length,
          activitiesLast24h: recentActivities.length,
          pageViewsLast24h: pageViews,
          courseViewsLast24h: courseViews
        },
        timeframe: {
          current: now.toISOString(),
          last24Hours: last24Hours.toISOString(),
          last7Days: last7Days.toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating analytics overview', error: error.message });
    }
  },

  getPageViewAnalytics: (req, res) => {
    try {
      const pageViews = activityLog
        .filter(activity => activity.action === 'page_view')
        .reduce((acc, activity) => {
          const page = activity.page || 'unknown';
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        }, {});

      const sortedPages = Object.entries(pageViews)
        .sort(([,a], [,b]) => b - a)
        .map(([page, views]) => ({ page, views }));

      res.json({
        totalPageViews: Object.values(pageViews).reduce((sum, views) => sum + views, 0),
        uniquePages: Object.keys(pageViews).length,
        pageBreakdown: sortedPages
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating page view analytics', error: error.message });
    }
  },

  getUserEngagement: (req, res) => {
    try {
      const userEngagement = {};
      
      activityLog.forEach(activity => {
        const userId = activity.userId || 'anonymous';
        if (!userEngagement[userId]) {
          userEngagement[userId] = {
            userId,
            totalActivities: 0,
            uniquePages: new Set(),
            firstSeen: activity.timestamp,
            lastSeen: activity.timestamp,
            actions: {}
          };
        }

        const user = userEngagement[userId];
        user.totalActivities++;
        user.uniquePages.add(activity.page);
        user.lastSeen = activity.timestamp;

        const action = activity.action || 'unknown';
        user.actions[action] = (user.actions[action] || 0) + 1;
      });

      // Convert Set to count and format response
      const formattedEngagement = Object.values(userEngagement).map(user => ({
        ...user,
        uniquePages: user.uniquePages.size,
        sessionDuration: new Date(user.lastSeen) - new Date(user.firstSeen)
      })).sort((a, b) => b.totalActivities - a.totalActivities);

      res.json({
        totalUsers: formattedEngagement.length,
        avgActivitiesPerUser: formattedEngagement.reduce((sum, user) => sum + user.totalActivities, 0) / formattedEngagement.length,
        userEngagement: formattedEngagement
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating user engagement analytics', error: error.message });
    }
  },

  getRealTimeMetrics: (req, res) => {
    try {
      const now = new Date();
      const lastMinute = new Date(now.getTime() - 60 * 1000);
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

      const recentActivities = activityLog.filter(activity => 
        new Date(activity.timestamp) >= lastMinute
      );

      const recent5MinActivities = activityLog.filter(activity => 
        new Date(activity.timestamp) >= last5Minutes
      );

      res.json({
        timestamp: now.toISOString(),
        realTime: {
          activeSessions: activeSessions.size,
          activitiesLastMinute: recentActivities.length,
          activitiesLast5Minutes: recent5MinActivities.length,
          activeUsers: new Set(recentActivities.map(a => a.userId)).size
        },
        trending: {
          topPages: recent5MinActivities
            .filter(a => a.action === 'page_view')
            .reduce((acc, activity) => {
              const page = activity.page || 'unknown';
              acc[page] = (acc[page] || 0) + 1;
              return acc;
            }, {}),
          recentActions: recentActivities.slice(-10).reverse()
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error generating real-time metrics', error: error.message });
    }
  },

  // Performance Monitoring
  getPerformanceMetrics: (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const recentMetrics = performanceMetrics.slice(-limit);

      const avgLoadTime = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, metric) => sum + (metric.loadTime || 0), 0) / recentMetrics.length 
        : 0;

      res.json({
        totalReports: performanceMetrics.length,
        recentReports: recentMetrics.length,
        averageLoadTime: Math.round(avgLoadTime * 100) / 100,
        metrics: recentMetrics.reverse()
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching performance metrics', error: error.message });
    }
  },

  reportPerformance: (req, res) => {
    try {
      const { sessionId, page, loadTime, resourceTimings, userAgent } = req.body;
      
      const performanceReport = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sessionId,
        page,
        loadTime,
        resourceTimings: resourceTimings || {},
        userAgent,
        memoryUsage: process.memoryUsage()
      };

      performanceMetrics.push(performanceReport);

      res.status(201).json({ 
        message: 'Performance report recorded', 
        reportId: performanceReport.id 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error recording performance report', error: error.message });
    }
  },

  // System Health
  getSystemHealth: (req, res) => {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
        },
        monitoring: {
          activeSessions: activeSessions.size,
          totalActivities: activityLog.length,
          performanceReports: performanceMetrics.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error checking system health', error: error.message });
    }
  }
};

module.exports = { userMonitoringController };
