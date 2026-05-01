import { Router } from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  deleteDeliveryNote
} from '../controllers/deliverynote.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

router.use(validateUser);

router.post('/', validateBody(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNoteById);
router.delete('/:id', deleteDeliveryNote);

export default router;
