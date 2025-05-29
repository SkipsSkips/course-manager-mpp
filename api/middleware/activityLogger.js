const { v4: uuidv4 } = require('uuid');

// In-memory activity storage (replace with database in production)
const activityLog = [];

const activityLogger = (req, res, next) => {
  try {
    // Only log certain request types
    const shouldLog = req.method === 'GET' && (
      req.path.startsWith('/api/') || 
      req.path === '/' ||
      req.path.startsWith('/courses') ||
      req.path.startsWith('/add')
    );

    if (shouldLog) {
      const activity = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sessionId: req.sessionId || 'unknown',
        userId: req.session?.userId || 'anonymous',
        action: determineAction(req),
        page: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        details: {
          query: req.query,
          referrer: req.headers.referer || null
        }
      };

      activityLog.push(activity);
    }

    next();
  } catch (error) {
    console.error('Activity logger error:', error);
    next(); // Continue even if logging fails
  }
};

const determineAction = (req) => {
  const path = req.path.toLowerCase();
  
  if (path.includes('/api/courses') && req.method === 'GET') {
    return 'course_view';
  } else if (path.includes('/api/charts')) {
    return 'chart_view';
  } else if (path.includes('/api/simulation')) {
    return 'simulation_action';
  } else if (path === '/') {
    return 'page_view';
  } else if (path.includes('/add')) {
    return 'add_course_page';
  } else if (path.startsWith('/api/')) {
    return 'api_call';
  } else {
    return 'page_view';
  }
};

module.exports = { activityLogger, activityLog };
