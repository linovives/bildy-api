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

  test('falla sin token', async () => {
    const res = await request(app).post('/api/client').send(clientData);
    expect(res.status).toBe(401);
  });
});

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
});

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
});

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
});

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
});

describe('GET /api/client/archived + PATCH restore', () => {
  test('lista archivados y restaura uno', async () => {
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const id = created.body.data._id;

    await request(app).delete(`/api/client/${id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const archived = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`);
    expect(archived.body.data).toHaveLength(1);

    const restore = await request(app).patch(`/api/client/${id}/restore`).set('Authorization', `Bearer ${token}`);
    expect(restore.status).toBe(200);
  });
});
