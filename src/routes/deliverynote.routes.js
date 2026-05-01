import { Router } from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNotePdf,
  signDeliveryNote,
  deleteDeliveryNote
} from '../controllers/deliverynote.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import { uploadSignature } from '../middleware/upload.middleware.js';

const router = Router();

router.use(validateUser);

// GET /pdf/:id antes de /:id para que no lo capture como parámetro
router.get('/pdf/:id', getDeliveryNotePdf);

router.post('/', validateBody(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNoteById);
router.patch('/:id/sign', uploadSignature, signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);

export default router;
