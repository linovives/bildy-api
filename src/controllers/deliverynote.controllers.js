import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';

// POST /api/deliverynote
export const createDeliveryNote = async (req, res) => {
  const { project, client, format, description, workDate, material, quantity, unit, hours, workers } = req.body;
  const user = req.user;

  const projectDoc = await Project.findOne({ _id: project, company: user.company, deleted: false });
  if (!projectDoc) throw AppError.notFound('Proyecto no encontrado en tu compañía');

  if (projectDoc.client.toString() !== client) {
    throw AppError.badRequest('El cliente no corresponde al proyecto indicado');
  }

  const note = await DeliveryNote.create({
    user: user._id,
    company: user.company,
    client,
    project,
    format,
    description,
    workDate,
    material,
    quantity,
    unit,
    hours,
    workers
  });

  res.status(201).json({ data: note });
};

// GET /api/deliverynote
export const getDeliveryNotes = async (req, res) => {
  const { page = 1, limit = 10, project, client, format, signed, from, to, sort = '-workDate' } = req.query;

  const filter = { company: req.user.company, deleted: false };
  if (project) filter.project = project;
  if (client) filter.client = client;
  if (format) filter.format = format;
  if (signed !== undefined) filter.signed = signed === 'true';
  if (from || to) {
    filter.workDate = {};
    if (from) filter.workDate.$gte = new Date(from);
    if (to) filter.workDate.$lte = new Date(to);
  }

  const sortField = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  const skip = (Number(page) - 1) * Number(limit);
  const totalItems = await DeliveryNote.countDocuments(filter);
  const notes = await DeliveryNote.find(filter)
    .sort(sortField)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    data: notes,
    currentPage: Number(page),
    totalPages: Math.ceil(totalItems / Number(limit)),
    totalItems
  });
};

// GET /api/deliverynote/:id
export const getDeliveryNoteById = async (req, res) => {
  const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false })
    .populate('user', 'name email')
    .populate('client', 'name cif email')
    .populate('project', 'name projectCode');

  if (!note) throw AppError.notFound('Albarán no encontrado');

  res.status(200).json({ data: note });
};

// DELETE /api/deliverynote/:id
export const deleteDeliveryNote = async (req, res) => {
  const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
  if (!note) throw AppError.notFound('Albarán no encontrado');

  if (note.signed) throw AppError.badRequest('No se puede eliminar un albarán firmado');

  await note.deleteOne();
  res.status(200).json({ message: 'Albarán eliminado correctamente' });
};
