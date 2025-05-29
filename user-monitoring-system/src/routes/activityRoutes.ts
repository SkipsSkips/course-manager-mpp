import express from 'express';
import { Op } from 'sequelize';
import { ActivityLog, UserActivitySummary, User } from '../config/database';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get user's own activity logs
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const logs = await ActivityLog.findAndCountAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });
    
    res.json({
      logs: logs.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: logs.count,
        pages: Math.ceil(logs.count / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
});

// Get all activity logs (Admin only)
router.get('/logs/all', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 100, userId } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereClause = userId ? { userId: parseInt(userId as string) } : {};
    
    const logs = await ActivityLog.findAndCountAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit as string),
      offset,
      include: [{
        model: User,
        attributes: ['username', 'email']
      }]
    });
    
    res.json({
      logs: logs.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: logs.count,
        pages: Math.ceil(logs.count / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
});

// Get activity summary (Admin only)
router.get('/summary', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    
    const summaries = await UserActivitySummary.findAll({
      where: {
        date: { [Op.gte]: daysAgo.toISOString().split('T')[0] }
      },
      include: [{
        model: User,
        attributes: ['username', 'email', 'isMonitored']
      }],
      order: [['suspiciousScore', 'DESC'], ['totalActions', 'DESC']]
    });
    
    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching activity summary', error: error.message });
  }
});

export default router;
