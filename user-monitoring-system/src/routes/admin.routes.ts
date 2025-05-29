import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();
const adminController = new AdminController();

router.get('/monitored-users', authMiddleware, roleMiddleware('admin'), adminController.getMonitoredUsers);
router.delete('/monitored-users/:id', authMiddleware, roleMiddleware('admin'), adminController.removeMonitoredUser);

export default router;