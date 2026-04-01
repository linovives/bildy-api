import { Router } from 'express';
import { register, validateEmail, login, updateProfile } from '../controllers/user.controllers.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { registerSchema, validateEmailSchema, loginSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

// POST /api/user/register
router.post('/register', validateBody(registerSchema), register);

// PUT /api/user/validation
router.put('/validation', validateUser, validateBody(validateEmailSchema), validateEmail);

// POST /api/user/login
router.post('/login', validateBody(loginSchema), login);

// PUT /api/user/register   
router.put('/register', validateUser, validateBody(updateProfileSchema), updateProfile);

export default router;