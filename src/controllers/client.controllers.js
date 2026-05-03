import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { getIo } from '../config/socket.js';

// POST /api/client
export const createClient = async (req, res) => {
  const { name, cif, email, phone, address } = req.body;
  const user = req.user;

  const exists = await Client.findOne({ company: user.company, cif });
  if (exists) {
    throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');
  }

  const client = await Client.create({
    user: user._id,
    company: user.company,
    name,
    cif,
    email,
    phone,
    address
  });

  getIo()?.to(user.company.toString()).emit('client:new', client);

  res.status(201).json({ data: client });
};

// PUT /api/client/:id
export const updateClient = async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!client) throw AppError.notFound('Cliente no encontrado');

  Object.assign(client, req.body);
  await client.save();

  res.status(200).json({ data: client });
};

// GET /api/client
export const getClients = async (req, res) => {
  const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query;

  const filter = { company: req.user.company, deleted: false };
  if (name) filter.name = { $regex: name, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const totalItems = await Client.countDocuments(filter);
  const clients = await Client.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    data: clients,
    currentPage: Number(page),
    totalPages: Math.ceil(totalItems / Number(limit)),
    totalItems
  });
};

// GET /api/client/archived
export const getArchivedClients = async (req, res) => {
  const clients = await Client.find({ company: req.user.company, deleted: true });
  res.status(200).json({ data: clients });
};

// GET /api/client/:id
export const getClientById = async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!client) throw AppError.notFound('Cliente no encontrado');

  res.status(200).json({ data: client });
};

// DELETE /api/client/:id
export const deleteClient = async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!client) throw AppError.notFound('Cliente no encontrado');

  if (req.query.soft === 'true') {
    client.deleted = true;
    await client.save();
    return res.status(200).json({ message: 'Cliente archivado correctamente' });
  }

  await client.deleteOne();
  res.status(200).json({ message: 'Cliente eliminado permanentemente' });
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: true });
  if (!client) throw AppError.notFound('Cliente archivado no encontrado');

  client.deleted = false;
  await client.save();

  res.status(200).json({ data: client });
};
