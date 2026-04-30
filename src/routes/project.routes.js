import { Router } from 'express';
import { createProject, updateProject, getProjects, getArchivedProjects, getProjectById, deleteProject, restoreProject } from '../controllers/project.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(validateUser);

router.get('/archived', getArchivedProjects);

router.post('/', validateBody(createProjectSchema), createProject);
router.put('/:id', validateBody(updateProjectSchema), updateProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.delete('/:id', deleteProject);
router.patch('/:id/restore', restoreProject);

export default router;
