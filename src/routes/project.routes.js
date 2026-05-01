import { Router } from 'express';
import { createProject, updateProject, getProjects, getArchivedProjects, getProjectById, deleteProject, restoreProject } from '../controllers/project.controllers.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(validateUser);

/**
 * @swagger
 * /project/archived:
 *   get:
 *     summary: Listar proyectos archivados
 *     tags: [Proyectos]
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 */
router.get('/archived', getArchivedProjects);

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Crear un proyecto
 *     tags: [Proyectos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, client]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Reforma oficina central
 *               projectCode:
 *                 type: string
 *                 example: PRJ-001
 *               client:
 *                 type: string
 *                 description: ID del cliente
 *               email:
 *                 type: string
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *               notes:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Proyecto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       409:
 *         description: Ya existe un proyecto con ese código
 */
router.post('/', validateBody(createProjectSchema), createProject);

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Actualizar un proyecto
 *     tags: [Proyectos]
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
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:id', validateBody(updateProjectSchema), updateProject);

/**
 * @swagger
 * /project:
 *   get:
 *     summary: Listar proyectos con paginación y filtros
 *     tags: [Proyectos]
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
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 */
router.get('/', getProjects);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', getProjectById);

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Eliminar o archivar un proyecto
 *     tags: [Proyectos]
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
 *     responses:
 *       200:
 *         description: Proyecto eliminado o archivado
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete('/:id', deleteProject);

/**
 * @swagger
 * /project/{id}/restore:
 *   patch:
 *     summary: Restaurar un proyecto archivado
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyecto restaurado
 *       404:
 *         description: Proyecto archivado no encontrado
 */
router.patch('/:id/restore', restoreProject);

export default router;
