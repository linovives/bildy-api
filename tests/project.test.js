import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import Client from '../src/models/Client.js';
import bcrypt from 'bcryptjs';

let token;
let clientId;

const userData = {
  email: 'project-test@bildy.com',
  password: 'Password123!',
  name: 'Test',
  lastName: 'User',
  nif: '12345678A'
};

const projectData = {
  name: 'Reforma oficina',
  projectCode: 'PRJ-001',
  email: 'proyecto@example.com'
};

beforeEach(async () => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({ ...userData, password: hashedPassword, status: 'verified' });
  const company = await Company.create({ name: 'Test Company', cif: 'A00000000', owner: user._id });
  user.company = company._id;
  await user.save();

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: userData.email, password: userData.password });
  token = loginRes.body.accessToken;

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Test', cif: 'B12345678' });
  clientId = clientRes.body.data._id;
});

// POST /api/project

describe('POST /api/project', () => {
  test('crea un proyecto correctamente', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...projectData, client: clientId });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(projectData.name);
  });

  test('falla si el código ya existe en la compañía', async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    expect(res.status).toBe(409);
  });

  test('falla si el cliente no existe', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...projectData, client: '000000000000000000000000' });
    expect(res.status).toBe(404);
  });

  test('falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo nombre' });
    expect(res.status).toBe(400);
  });

  test('falla sin token', async () => {
    const res = await request(app).post('/api/project').send({ ...projectData, client: clientId });
    expect(res.status).toBe(401);
  });
});

// GET /api/project

describe('GET /api/project', () => {
  test('lista los proyectos con paginación', async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });

    const res = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalItems).toBe(1);
  });

  test('filtra por cliente', async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });

    const res = await request(app)
      .get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/project');
    expect(res.status).toBe(401);
  });
});

// GET /api/project/:id

describe('GET /api/project/:id', () => {
  test('obtiene un proyecto por id', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const id = created.body.data._id;

    const res = await request(app).get(`/api/project/${id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app).get('/api/project/000000000000000000000000').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/project/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});

// PUT /api/project/:id

describe('PUT /api/project/:id', () => {
  test('actualiza un proyecto', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/project/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Reforma actualizada' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Reforma actualizada');
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app)
      .put('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre nuevo' });

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .put('/api/project/000000000000000000000000')
      .send({ name: 'Nombre nuevo' });

    expect(res.status).toBe(401);
  });
});

// DELETE /api/project/:id

describe('DELETE /api/project/:id', () => {
  test('elimina un proyecto (hard delete)', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/project/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('archiva un proyecto (soft delete)', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/project/${id}?soft=true`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app)
      .delete('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).delete('/api/project/000000000000000000000000');
    expect(res.status).toBe(401);
  });
});

// GET /api/project/archived

describe('GET /api/project/archived', () => {
  test('lista los proyectos archivados', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    await request(app).delete(`/api/project/${created.body.data._id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/project/archived').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('falla sin token', async () => {
    const res = await request(app).get('/api/project/archived');
    expect(res.status).toBe(401);
  });
});

// PATCH /api/project/:id/restore

describe('PATCH /api/project/:id/restore', () => {
  test('restaura un proyecto archivado', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const id = created.body.data._id;
    await request(app).delete(`/api/project/${id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/project/${id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('devuelve 404 si el proyecto no está archivado', async () => {
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });

    const res = await request(app)
      .patch(`/api/project/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app).patch('/api/project/000000000000000000000000/restore');
    expect(res.status).toBe(401);
  });
});
