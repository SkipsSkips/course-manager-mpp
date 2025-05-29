import express from 'express';
import { User } from '../config/database';
import { AuthRequest, requireAdmin } from '../middleware/auth';
import { getMonitoredUsers } from '../services/monitoringService';

const router = express.Router();

// Get monitored users (Admin only)
router.get('/monitored', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const monitoredUsers = await getMonitoredUsers();
    res.json({
      count: monitoredUsers.length,
      users: monitoredUsers
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching monitored users', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'isMonitored', 'monitoredSince', 'createdAt']
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get current user profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isMonitored: req.user.isMonitored
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

export default router;
