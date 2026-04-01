import { Router } from 'express';
import { register, validateEmail } from '../controllers/user.controllers.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { registerSchema, validateEmailSchema } from '../validators/user.validator.js';

const router = Router();

// POST /api/user/register
router.post('/register', validateBody(registerSchema), register);


router.put('/validation', validateUser, validateBody(validateEmailSchema), validateEmail);

export default router;