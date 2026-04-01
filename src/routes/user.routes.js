import { Router } from 'express';
import { register } from '../controllers/user.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema } from '../validators/user.validator.js';

const router = Router();

// POST /api/user/register
router.post('/register', validateBody(registerSchema), register);

export default router;