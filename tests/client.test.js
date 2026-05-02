import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import bcrypt from 'bcryptjs';

let token;
let companyId;

const userData = {
  email: 'client-test@bildy.com',
  password: 'Password123!',
  name: 'Test',
  lastName: 'User',
  nif: '12345678A'
};

const clientData = {
  name: 'García S.L.',
  cif: 'B12345678',
  email: 'garcia@example.com',
  phone: '600000000'
};

beforeEach(async () => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({ ...userData, password: hashedPassword, status: 'verified' });
  const company = await Company.create({ name: 'Test Company', cif: 'A00000000', owner: user._id });
  companyId = company._id;
  user.company = companyId;
  await user.save();

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: userData.email, password: userData.password });
  token = loginRes.body.accessToken;
});

// POST /api/client

describe('POST /api/client', () => {
  test('crea un cliente correctamente', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientData);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(clientData.name);
  });

  test('falla si el CIF ya existe en la compañía', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    expect(res.status).toBe(409);
  });

  test('falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'solo@email.com' });

    expect(res.status).toBe(400);
  });

  test('falla sin token', async () => {
    const res = await request(app).post('/api/client').send(clientData);
    expect(res.status).toBe(401);
  });
});

// GET /api/client

describe('GET /api/client', () => {
  test('lista los clientes con paginación', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);

    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalItems).toBe(1);
  });

  test('filtra por nombre', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);

    const res = await request(app)
      .get('/api/client?name=García')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/client');
    expect(res.status).toBe(401);
  });
});

// GET /api/client/:id

describe('GET /api/client/:id', () => {
  test('obtiene un cliente por id', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;

    const res = await request(app)
      .get(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/client/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});

// PUT /api/client/:id

describe('PUT /api/client/:id', () => {
  test('actualiza un cliente', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'García Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('García Actualizado');
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app)
      .put('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .put('/api/client/000000000000000000000000')
      .send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(401);
  });
});

// DELETE /api/client/:id

describe('DELETE /api/client/:id', () => {
  test('elimina un cliente (hard delete)', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('archiva un cliente (soft delete)', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/client/${id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app)
      .delete('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).delete('/api/client/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});

// GET /api/client/archived

describe('GET /api/client/archived', () => {
  test('lista los clientes archivados', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    await request(app).delete(`/api/client/${created.body.data._id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/client/archived');
    expect(res.status).toBe(401);
  });
});

// PATCH /api/client/:id/restore

describe('PATCH /api/client/:id/restore', () => {
  test('restaura un cliente archivado', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;
    await request(app).delete(`/api/client/${id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/client/${id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('devuelve 404 si el cliente no está archivado', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);

    const res = await request(app)
      .patch(`/api/client/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).patch('/api/client/000000000000000000000000/restore');
    expect(res.status).toBe(401);
  });
});
