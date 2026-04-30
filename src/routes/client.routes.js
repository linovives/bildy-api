import { Router } from 'express';
import { createClient, updateClient, getClients, getArchivedClients, getClientById, deleteClient, restoreClient } from '../controllers/client.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(validateUser);

// GET /api/client/archived — antes de /:id para que no lo capture como parámetro
router.get('/archived', getArchivedClients);

router.post('/', validateBody(createClientSchema), createClient);
router.put('/:id', validateBody(updateClientSchema), updateClient);
router.get('/', getClients);
router.get('/:id', getClientById);
router.delete('/:id', deleteClient);
router.patch('/:id/restore', restoreClient);

export default router;
