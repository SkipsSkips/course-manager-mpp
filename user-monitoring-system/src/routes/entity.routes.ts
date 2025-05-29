import { Router } from 'express';
import { EntityController } from '../controllers/entity.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

const router = Router();
const entityController = new EntityController();

// Public routes
router.get('/', entityController.getAllEntities);
router.get('/:id', entityController.getEntityById);

// Protected routes
router.use(authMiddleware);
router.post('/', entityController.createEntity);
router.put('/:id', entityController.updateEntity);
router.delete('/:id', entityController.deleteEntity);

// Admin routes
router.use(roleMiddleware('admin'));
router.get('/admin', entityController.getAdminEntities);

export default router;