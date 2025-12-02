import { Router } from 'express';
import * as user from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.get('/me', authenticate, user.getProfile);
router.put('/me', authenticate, user.updateProfile);
router.put('/me/location', authenticate, user.updateLocation);
export default router;
