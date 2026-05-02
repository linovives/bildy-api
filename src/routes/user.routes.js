import { Router } from 'express';
import { register, validateEmail, login, updateProfile, updateCompany, updateLogo, getUserProfile,
         refreshSession, logoutSession, deleteUser, changePassword, inviteUser } from '../controllers/user.controllers.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { validateUser } from '../middleware/auth.middleware.js';
import { registerSchema, validateEmailSchema, loginSchema, updateProfileSchema, companySchema, changePasswordSchema } from '../validators/user.validator.js';
import { uploadLogo } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, lastName, nif]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123!
 *               name:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: García
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El email ya existe
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @swagger
 * /user/validation:
 *   put:
 *     summary: Validar el email con el código recibido
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Email verificado correctamente
 *       400:
 *         description: Código incorrecto o usuario ya verificado
 *       401:
 *         description: No autorizado
 */
router.put('/validation', validateUser, validateBody(validateEmailSchema), validateEmail);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login correcto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Credenciales incorrectas
 *       403:
 *         description: Email no verificado
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @swagger
 * /user/register:
 *   put:
 *     summary: Actualizar datos personales del usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, nif]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: García
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.put('/register', validateUser, validateBody(updateProfileSchema), updateProfile);

/**
 * @swagger
 * /user/company:
 *   patch:
 *     summary: Crear o unirse a una compañía
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFreelance:
 *                 type: boolean
 *                 example: false
 *               name:
 *                 type: string
 *                 example: Mi Empresa S.L.
 *               cif:
 *                 type: string
 *                 example: B12345678
 *     responses:
 *       200:
 *         description: Compañía creada o unido a una existente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: No autorizado
 */
router.patch('/company', validateUser, validateBody(companySchema), updateCompany);

/**
 * @swagger
 * /user/logo:
 *   patch:
 *     summary: Subir logo de la compañía
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo actualizado correctamente
 *       400:
 *         description: No se ha enviado ninguna imagen
 *       401:
 *         description: No autorizado
 *       404:
 *         description: El usuario no tiene compañía asociada
 */
router.patch('/logo', validateUser, uploadLogo, updateLogo);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 */
router.get('/', validateUser, getUserProfile);

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Renovar el access token
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevo access token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', refreshSession);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       400:
 *         description: Se requiere el refreshToken
 *       401:
 *         description: No autorizado
 */
router.post('/logout', validateUser, logoutSession);

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Eliminar o archivar el usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Si es true, archiva en lugar de borrar
 *     responses:
 *       200:
 *         description: Usuario eliminado o archivado
 *       401:
 *         description: No autorizado
 */
router.delete('/', validateUser, deleteUser);

/**
 * @swagger
 * /user/password:
 *   put:
 *     summary: Cambiar la contraseña
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Password123!
 *               newPassword:
 *                 type: string
 *                 example: NewPassword456!
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: La nueva contraseña debe ser diferente
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/password', validateUser, validateBody(changePasswordSchema), changePassword);

/**
 * @swagger
 * /user/invite:
 *   post:
 *     summary: Invitar a un usuario a la compañía (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitación enviada y usuario creado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo los administradores pueden invitar
 */
router.post('/invite', validateUser, inviteUser);

export default router;
