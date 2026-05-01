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

/**
 * @swagger
 * /deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar albarán en PDF
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirección a URL del PDF en la nube (si ya está firmado)
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/pdf/:id', getDeliveryNotePdf);

/**
 * @swagger
 * /deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [Albaranes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, client, format, workDate]
 *             properties:
 *               project:
 *                 type: string
 *               client:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [material, hours]
 *               description:
 *                 type: string
 *               workDate:
 *                 type: string
 *                 format: date
 *               material:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               hours:
 *                 type: number
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     hours:
 *                       type: number
 *     responses:
 *       201:
 *         description: Albarán creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Proyecto no encontrado
 */
router.post('/', validateBody(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @swagger
 * /deliverynote:
 *   get:
 *     summary: Listar albaranes con paginación y filtros
 *     tags: [Albaranes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -workDate
 *     responses:
 *       200:
 *         description: Lista paginada de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del albarán con populate de usuario, cliente y proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', getDeliveryNoteById);

/**
 * @swagger
 * /deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma
 *     responses:
 *       200:
 *         description: Albarán firmado y PDF generado
 *       400:
 *         description: El albarán ya está firmado o falta la imagen
 *       404:
 *         description: Albarán no encontrado
 */
router.patch('/:id/sign', uploadSignature, signDeliveryNote);

/**
 * @swagger
 * /deliverynote/{id}:
 *   delete:
 *     summary: Borrar un albarán (solo si no está firmado)
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       400:
 *         description: No se puede eliminar un albarán firmado
 *       404:
 *         description: Albarán no encontrado
 */
router.delete('/:id', deleteDeliveryNote);

export default router;
