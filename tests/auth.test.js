import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

const userData = {
  email: 'test@bildy.com',
  password: 'Password123!',
  name: 'Test',
  lastName: 'User',
  nif: '12345678A'
};

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
    const res = await request(app).post('/api/user/register').send({ email: 'solo@email.com' });
    expect(res.status).toBe(400);
  });
});

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
});

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
});

describe('GET /api/user', () => {
  test('devuelve el perfil del usuario autenticado', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword, status: 'verified' });

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    const token = loginRes.body.accessToken;

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
});
