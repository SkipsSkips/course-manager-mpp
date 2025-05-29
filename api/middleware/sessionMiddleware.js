const { v4: uuidv4 } = require('uuid');

// In-memory session storage (replace with Redis in production)
const activeSessions = new Map();

const sessionMiddleware = (req, res, next) => {
  try {
    // Get session ID from header or create new one
    let sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    if (!sessionId || !activeSessions.has(sessionId)) {
      sessionId = uuidv4();
      
      // Create new session
      const session = {
        sessionId,
        userId: req.headers['x-user-id'] || 'anonymous',
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pageViews: [],
        currentPage: req.path || '/'
      };
      
      activeSessions.set(sessionId, session);
    } else {
      // Update existing session
      const session = activeSessions.get(sessionId);
      session.lastActivity = new Date().toISOString();
      session.currentPage = req.path || '/';
    }
    
    // Add session info to request
    req.sessionId = sessionId;
    req.session = activeSessions.get(sessionId);
    
    // Set session ID in response header
    res.setHeader('X-Session-ID', sessionId);
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(); // Continue even if session fails
  }
};

// Cleanup old sessions (run periodically)
const cleanupSessions = () => {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of activeSessions) {
    const lastActivity = new Date(session.lastActivity);
    if (now - lastActivity > timeout) {
      activeSessions.delete(sessionId);
    }
  }
};

// Cleanup every 5 minutes
setInterval(cleanupSessions, 5 * 60 * 1000);

module.exports = { sessionMiddleware, activeSessions };
