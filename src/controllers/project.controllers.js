import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { getIo } from '../config/socket.js';

// POST /api/project
export const createProject = async (req, res) => {
  const { name, projectCode, client, email, address, notes, active } = req.body;
  const user = req.user;

  const clientDoc = await Client.findOne({ _id: client, company: user.company, deleted: false });
  if (!clientDoc) throw AppError.notFound('Cliente no encontrado en tu compañía');

  const exists = await Project.findOne({ company: user.company, projectCode });
  if (exists) throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');

  const project = await Project.create({
    user: user._id,
    company: user.company,
    client,
    name,
    projectCode,
    email,
    address,
    notes,
    active
  });

  getIo()?.to(user.company.toString()).emit('project:new', project);

  res.status(201).json({ data: project });
};

// PUT /api/project/:id
export const updateProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!project) throw AppError.notFound('Proyecto no encontrado');

  Object.assign(project, req.body);
  await project.save();

  res.status(200).json({ data: project });
};

// GET /api/project
export const getProjects = async (req, res) => {
  const { page = 1, limit = 10, name, client, active, sort = '-createdAt' } = req.query;

  const filter = { company: req.user.company, deleted: false };
  if (name) filter.name = { $regex: name, $options: 'i' };
  if (client) filter.client = client;
  if (active !== undefined) filter.active = active === 'true';

  const sortField = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  const skip = (Number(page) - 1) * Number(limit);
  const totalItems = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .sort(sortField)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    data: projects,
    currentPage: Number(page),
    totalPages: Math.ceil(totalItems / Number(limit)),
    totalItems
  });
};

// GET /api/project/archived
export const getArchivedProjects = async (req, res) => {
  const projects = await Project.find({ company: req.user.company, deleted: true });
  res.status(200).json({ data: projects });
};

// GET /api/project/:id
export const getProjectById = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!project) throw AppError.notFound('Proyecto no encontrado');

  res.status(200).json({ data: project });
};

// DELETE /api/project/:id
export const deleteProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!project) throw AppError.notFound('Proyecto no encontrado');

  if (req.query.soft === 'true') {
    project.deleted = true;
    await project.save();
    return res.status(200).json({ message: 'Proyecto archivado correctamente' });
  }

  await project.deleteOne();
  res.status(200).json({ message: 'Proyecto eliminado permanentemente' });
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: true });
  if (!project) throw AppError.notFound('Proyecto archivado no encontrado');

  project.deleted = false;
  await project.save();

  res.status(200).json({ data: project });
};
