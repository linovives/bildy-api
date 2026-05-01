import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import bcrypt from 'bcryptjs';

let token;
let clientId;
let projectId;

const userData = {
  email: 'note-test@bildy.com',
  password: 'Password123!',
  name: 'Test',
  lastName: 'User',
  nif: '12345678A'
};

const noteHours = {
  format: 'hours',
  description: 'Trabajo de fontanería',
  workDate: '2025-06-01',
  hours: 8
};

const noteMaterial = {
  format: 'material',
  description: 'Entrega de material',
  workDate: '2025-06-01',
  material: 'Cemento',
  quantity: 10,
  unit: 'sacos'
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

  const projectRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto Test', projectCode: 'PRJ-001', client: clientId });
  projectId = projectRes.body.data._id;
});

describe('POST /api/deliverynote', () => {
  test('crea un albarán de horas', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...noteHours, project: projectId, client: clientId });

    expect(res.status).toBe(201);
    expect(res.body.data.format).toBe('hours');
  });

  test('crea un albarán de material', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...noteMaterial, project: projectId, client: clientId });

    expect(res.status).toBe(201);
    expect(res.body.data.format).toBe('material');
  });

  test('falla si el proyecto no existe', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...noteHours, project: '000000000000000000000000', client: clientId });

    expect(res.status).toBe(404);
  });

  test('falla sin token', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .send({ ...noteHours, project: projectId, client: clientId });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/deliverynote', () => {
  test('lista los albaranes con paginación', async () => {
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteHours, project: projectId, client: clientId });

    const res = await request(app).get('/api/deliverynote').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.totalItems).toBe(1);
  });

  test('filtra por formato', async () => {
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteHours, project: projectId, client: clientId });
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteMaterial, project: projectId, client: clientId });

    const res = await request(app).get('/api/deliverynote?format=hours').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/deliverynote/:id', () => {
  test('obtiene un albarán por id con populate', async () => {
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteHours, project: projectId, client: clientId });
    const id = created.body.data._id;

    const res = await request(app).get(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.client.name).toBeDefined();
    expect(res.body.data.project.name).toBeDefined();
  });

  test('devuelve 404 si no existe', async () => {
    const res = await request(app).get('/api/deliverynote/000000000000000000000000').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/deliverynote/:id', () => {
  test('elimina un albarán no firmado', async () => {
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteHours, project: projectId, client: clientId });
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('no permite borrar un albarán firmado', async () => {
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({ ...noteHours, project: projectId, client: clientId });
    const id = created.body.data._id;

    // Marcar como firmado directamente en DB
    const { default: DeliveryNote } = await import('../src/models/DeliveryNote.js');
    await DeliveryNote.findByIdAndUpdate(id, { signed: true });

    const res = await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
