import { Router } from 'express';
import { register, validateEmail, login, updateProfile, updateCompany, updateLogo, getUserProfile, 
         refreshSession, logoutSession, deleteUser, changePassword, inviteUser } from '../controllers/user.controllers.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { registerSchema, validateEmailSchema, loginSchema, updateProfileSchema, companySchema, changePasswordSchema } from '../validators/user.validator.js';
import { uploadLogo } from '../middleware/upload.middleware.js';

const router = Router();

// POST /api/user/register
router.post('/register', validateBody(registerSchema), register);

// PUT /api/user/validation
router.put('/validation', validateUser, validateBody(validateEmailSchema), validateEmail);

// POST /api/user/login
router.post('/login', validateBody(loginSchema), login);

// PUT /api/user/register   
router.put('/register', validateUser, validateBody(updateProfileSchema), updateProfile);

// PATCH /api/user/company
router.patch('/company', validateUser, validateBody(companySchema), updateCompany);

// PATCH /api/user/logo
router.patch('/logo', validateUser, uploadLogo, updateLogo);

// GET /api/user
router.get('/', validateUser, getUserProfile);

// POST /api/user/refresh
router.post('/refresh', refreshSession);  

// POST /api/user/logout
router.post('/logout', validateUser, logoutSession);

// DELETE /api/user
router.delete('/', validateUser, deleteUser);

// PUT /api/user/password
router.put('/password', validateUser, validateBody(changePasswordSchema), changePassword);

// POST /api/user/invite
router.post('/invite', validateUser, inviteUser);
export default router;