import { Router } from 'express';
import { createClient, updateClient, getClients, getArchivedClients, getClientById, deleteClient, restoreClient } from '../controllers/client.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(validateUser);

/**
 * @swagger
 * /client/archived:
 *   get:
 *     summary: Listar clientes archivados
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       401:
 *         description: No autorizado
 */
router.get('/archived', getArchivedClients);

/**
 * @swagger
 * /client:
 *   post:
 *     summary: Crear un cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:
 *                 type: string
 *                 example: García S.L.
 *               cif:
 *                 type: string
 *                 example: B12345678
 *               email:
 *                 type: string
 *                 example: contacto@garcia.com
 *               phone:
 *                 type: string
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Ya existe un cliente con ese CIF
 */
router.post('/', validateBody(createClientSchema), createClient);

/**
 * @swagger
 * /client/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/:id', validateBody(updateClientSchema), updateClient);

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Listar clientes con paginación y filtros
 *     tags: [Clientes]
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
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 */
router.get('/', getClients);

/**
 * @swagger
 * /client/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', getClientById);

/**
 * @swagger
 * /client/{id}:
 *   delete:
 *     summary: Eliminar o archivar un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Si es true, archiva en lugar de borrar
 *     responses:
 *       200:
 *         description: Cliente eliminado o archivado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /client/{id}/restore:
 *   patch:
 *     summary: Restaurar un cliente archivado
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente restaurado
 *       404:
 *         description: Cliente archivado no encontrado
 */
router.patch('/:id/restore', restoreClient);

export default router;
