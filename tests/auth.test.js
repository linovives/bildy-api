import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import bcrypt from 'bcryptjs';

const userData = {
  email: 'test@bildy.com',
  password: 'Password123!',
  name: 'Test',
  lastName: 'User',
  nif: '12345678A'
};

// Crea un usuario verificado y devuelve su accessToken
const getVerifiedToken = async () => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  await User.create({ ...userData, password: hashedPassword, status: 'verified' });
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: userData.email, password: userData.password });
  return loginRes.body.accessToken;
};

// Crea un usuario verificado y devuelve { accessToken, refreshToken }
const getVerifiedSession = async () => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  await User.create({ ...userData, password: hashedPassword, status: 'verified' });
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: userData.email, password: userData.password });
  return {
    accessToken: loginRes.body.accessToken,
    refreshToken: loginRes.body.refreshToken
  };
};

//  REGISTER

describe('POST /api/user/register', () => {
  test('registra un usuario correctamente', async () => {
    const res = await request(app).post('/api/user/register').send(userData);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('falla si el email ya existe', async () => {
    await request(app).post('/api/user/register').send(userData);
    const res = await request(app).post('/api/user/register').send(userData);
    expect(res.status).toBe(409);
  });

  test('falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'solo@email.com' });
    expect(res.status).toBe(400);
  });

  test('falla si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ ...userData, email: 'estonoesunEmail' });
    expect(res.status).toBe(400);
  });

  test('falla si la contraseña tiene menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ ...userData, password: '123' });
    expect(res.status).toBe(400);
  });
});

// VALIDATION 

describe('PUT /api/user/validation', () => {
  test('valida el email con el código correcto', async () => {
    const registerRes = await request(app).post('/api/user/register').send(userData);
    const token = registerRes.body.data.accessToken;
    const user = await User.findOne({ email: userData.email });
    const code = user.verificationCode;

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });

    expect(res.status).toBe(200);
  });

  test('falla con código incorrecto', async () => {
    const registerRes = await request(app).post('/api/user/register').send(userData);
    const token = registerRes.body.data.accessToken;

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });

  test('falla sin token de autenticación', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .send({ code: '123456' });

    expect(res.status).toBe(401);
  });

  test('falla si el usuario ya está verificado', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });

    expect(res.status).toBe(400);
  });
});

//  LOGIN 

describe('POST /api/user/login', () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword, status: 'verified' });
  });

  test('hace login correctamente', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test('falla con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('falla si el usuario no está verificado', async () => {
    await User.create({
      ...userData,
      email: 'unverified@bildy.com',
      password: await bcrypt.hash(userData.password, 10),
      status: 'pending'
    });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'unverified@bildy.com', password: userData.password });

    expect(res.status).toBe(403);
  });

  test('falla si el email no existe', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'noexiste@bildy.com', password: userData.password });

    expect(res.status).toBe(401);
  });

  test('falla si no se envía la contraseña', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email });

    expect(res.status).toBe(400);
  });
});

//  GET PERFIL 

describe('GET /api/user', () => {
  test('devuelve el perfil del usuario autenticado', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userData.email);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });

  test('falla con token malformado', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer esto.no.es.un.token.valido');

    expect(res.status).toBe(401);
  });
});

//  UPDATE PROFILE 

describe('PUT /api/user/register (updateProfile)', () => {
  test('actualiza el perfil del usuario', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo', lastName: 'Nombre', nif: '87654321B' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Nuevo');
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .put('/api/user/register')
      .send({ name: 'Nuevo', lastName: 'Nombre', nif: '87654321B' });

    expect(res.status).toBe(401);
  });

  test('falla si faltan campos obligatorios', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo nombre' });

    expect(res.status).toBe(400);
  });
});

//  COMPANY 

describe('PATCH /api/user/company', () => {
  test('crea una compañía', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: false, name: 'Mi Empresa', cif: 'B99999999' });

    expect(res.status).toBe(200);
    expect(res.body.company.cif).toBe('B99999999');
  });

  test('se une a una compañía existente', async () => {
    const token = await getVerifiedToken();
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: false, name: 'Empresa Shared', cif: 'C11111111' });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, email: 'otro@bildy.com', password: hashedPassword, status: 'verified' });
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'otro@bildy.com', password: userData.password });
    const token2 = loginRes.body.accessToken;

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token2}`)
      .send({ isFreelance: false, name: 'Empresa Shared', cif: 'C11111111' });

    expect(res.status).toBe(200);
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .patch('/api/user/company')
      .send({ name: 'Mi Empresa', cif: 'B99999999' });

    expect(res.status).toBe(401);
  });

  test('crea la compañía en modo freelance', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: true });

    expect(res.status).toBe(200);
  });
});

//  LOGO 

describe('PATCH /api/user/logo', () => {
  test('falla sin token', async () => {
    const res = await request(app).patch('/api/user/logo');
    expect(res.status).toBe(401);
  });

  test('falla si no se envía ninguna imagen', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('falla si el usuario no tiene compañía', async () => {
    const token = await getVerifiedToken();
    const fakeImage = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', fakeImage, { filename: 'logo.png', contentType: 'image/png' });

    expect(res.status).toBe(404);
  });

  test('sube el logo correctamente', async () => {
    const token = await getVerifiedToken();
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: false, name: 'Empresa Logo', cif: 'L12345678' });

    const fakeImage = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', fakeImage, { filename: 'logo.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.logo).toBeDefined();
  });
});

//  CHANGE PASSWORD 

describe('PUT /api/user/password', () => {
  test('cambia la contraseña correctamente', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: userData.password, newPassword: 'NewPassword456!' });

    expect(res.status).toBe(200);
  });

  test('falla con contraseña actual incorrecta', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewPassword456!' });

    expect(res.status).toBe(401);
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .send({ currentPassword: userData.password, newPassword: 'NewPassword456!' });

    expect(res.status).toBe(401);
  });

  test('falla si la nueva contraseña es igual a la actual', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: userData.password, newPassword: userData.password });

    expect(res.status).toBe(400);
  });

  test('falla si la nueva contraseña es demasiado corta', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: userData.password, newPassword: '123' });

    expect(res.status).toBe(400);
  });
});

//  REFRESH TOKEN 

describe('POST /api/user/refresh', () => {
  test('renueva el access token con un refresh token válido', async () => {
    const { refreshToken } = await getVerifiedSession();

    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('falla con un refresh token inválido', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: 'tokeninvalido.falso.123' });

    expect(res.status).toBe(401);
  });

  test('falla si no se envía el refresh token', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({});

    expect(res.status).toBe(401);
  });
});

//  LOGOUT 

describe('POST /api/user/logout', () => {
  test('cierra la sesión correctamente', async () => {
    const { accessToken, refreshToken } = await getVerifiedSession();

    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });

  test('falla si no se proporciona el refreshToken', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('falla sin token de autenticación', async () => {
    const res = await request(app)
      .post('/api/user/logout')
      .send({ refreshToken: 'cualquier-token' });

    expect(res.status).toBe(401);
  });
});

//  DELETE USER 

describe('DELETE /api/user', () => {
  test('elimina el usuario (hard delete)', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('archiva el usuario (soft delete)', async () => {
    const token = await getVerifiedToken();

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('falla sin token', async () => {
    const res = await request(app).delete('/api/user');
    expect(res.status).toBe(401);
  });
});
