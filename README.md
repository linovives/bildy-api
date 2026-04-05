# Bildy App

Este proyecto consiste en una API REST desarrollada con Node.js y Express para la gestion de usuarios y empresas. Implementa un flujo completo de autenticacion, validacion de datos y gestion de permisos.

## Requisitos

- Node.js 22+
- Express 5
- MongoDB + Mongoose
- Zod
- JWT
- bcryptjs
- Multer
- Helmet

## Pasos para la instalacion

1. Descarga del proyecto:
Clona el repositorio en su maquina local e introduzcase en la carpeta del proyecto:
```bash
git clone https://github.com/Vaibs16/practica-intermedia-LinoVives.git
cd practica-intermedia-LinoVives
```
2. Instalación de dependencias:
```bash
npm install
```
3. Configuracion de variables de entorno:
El proyecto requiere de ciertas variables para conectar con la base de datos y gestionar la seguridad. Copie el archivo de ejemplo:
```bash
cp .env.example .env
```
Abre el nuevo archivo .env y rellena los valores obligatorios (PORT, MONGO_URL y JWT_SECRET).

## Ejecucion del servidor

Modo desarrollo: Utiliza el flag --watch de Node.js para reiniciar el servidor automaticamente al detectar cambios.
```bash
npm run dev
```

Modo produccion: Arranca la aplicacion de forma estandar.

```bash
npm start
```

## Funcionalidades implementadas (endpoints)

1. Registro y Validacion

- POST /api/user/register: Crea un usuario con rol admin por defecto. Valida email y contraseña (min. 8 caracteres) con Zod. Cifra la contraseña con bcryptjs y genera un codigo de verificacion de 6 digitos.

- PUT /api/user/validation: Requiere JWT. Valida el codigo de 6 digitos. Si es correcto, cambia el estado a verified. Gestiona un maximo de 3 intentos antes de bloquear la peticion (429).

- POST /api/user/login: Autentica al usuario y devuelve datos de perfil junto a un access token y un refresh token.

2. Onboarding 

- PUT /api/user/register: Requiere JWT. Actualiza los datos personales del usuario (nombre, apellidos y NIF).

- PATCH /api/user/company: Requiere JWT. Vincula al usuario a una empresa mediante el CIF. Si el CIF no existe, crea la empresa (usuario es owner/admin). Si existe, el usuario se une y cambia su rol a guest. Soporta logica automatica para autonomos (isFreelance: true).

- PATCH /api/user/logo: Requiere JWT y compañia asociada. Permite la subida de un logo mediante multer con limite de 5MB.

3. Gestion de Perfil y Sesion

- GET /api/user: Requiere JWT. Devuelve el perfil completo del usuario incluyendo los datos de la compañia mediante populate y el campo virtual fullName.

- POST /api/user/refresh: Recibe un refreshToken y genera un nuevo accessToken si el token es valido y no ha expirado.

- POST /api/user/logout: Requiere JWT. Invalida la sesion eliminando o invalidando el refresh token del usuario.

4. Administracion y Seguridad

- DELETE /api/user: Requiere JWT. Permite la eliminacion de la cuenta. Soporta borrado logico (soft delete) mediante el parametro ?soft=true.

- PUT /api/user/password: Requiere JWT. Permite cambiar la contraseña validando la actual. Usa .refine() de Zod para asegurar que la nueva sea distinta a la anterior.

- POST /api/user/invite: Solo para admin. Crea un nuevo usuario con rol guest vinculado a la misma compañia y dispara un evento user:invited mediante EventEmitter.


## Guía de pruebas con api.http

Para facilitar la corrección, el archivo `api.http` está configurado con variables que capturan los tokens automáticamente. Sigue estos pasos en orden:

### 1. Flujo de Registro y Validación (Puntos 1 y 2)
1. Ejecuta la petición **1. Registro**. El token se guardará automáticamente en la variable `{{registro_token}}`.
2. **Importante**: El código de verificación de 6 dígitos se imprimirá en la **consola/terminal** donde se está ejecutando el servidor.
3. Copia este código y pegalo en el cuerpo de la petición **2. Validación**.

### 2. Flujo de Sesión y Onboarding (Puntos 3 al 10)
1. Ejecuta la petición **3. Login**. Esto actualizará automáticamente las variables `{{login_token}}` y `{{refresh_token}}`.
2. A partir de este momento, puede ejecutar cualquier otra petición (Onboarding, Logo, Perfil, Refresh, Logout, etc.) de forma consecutiva. No es necesario copiar y pegar tokens manualmente entre peticiones.

### 3. Notas técnicas sobre los Tokens
- El endpoint de **Registro** devuelve los tokens dentro de un objeto `data`, mientras que el **Login** los devuelve en la raíz del JSON. El archivo `api.http` ya gestiona ambas estructuras de forma transparente.
- Si recibes un error `401 Unauthorized` por expiración del token, simplemente vuelve a ejecutar la petición de **Login** para refrescar las variables.

### Consideraciones importantes para el testeo funcional

Para que el flujo de corrección en `api.http` sea exitoso y no se produzcan errores de validación, ten en cuenta lo siguiente:

1. **Orden Lógico**: Es imprescindible seguir el orden numérico (1. Registro -> 2. Validación -> 3. Login). La API no permitirá el acceso a usuarios que no hayan sido verificados con el código de 6 dígitos.
2. **Credenciales de Login**: Asegúrate de utilizar el mismo email y contraseña que registró en el paso 1.
3. **Cambio de Contraseña (Punto 9)**: 
   - En el campo `currentPassword`, debe introducir la contraseña exacta con la que hizo el login.
   - La API verificará que la contraseña actual sea correcta antes de permitir el cambio.
   - El esquema de Zod validará mediante `.refine()` que la `newPassword` sea diferente a la `currentPassword`.
4. **Persistencia de sesión**: Si reinicia el servidor o el token expira (401 Unauthorized), simplemente vuelva a ejecutar la petición de **3. Login** para actualizar las variables automáticas del archivo.
