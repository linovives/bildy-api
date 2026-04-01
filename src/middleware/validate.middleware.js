import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    const details = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    next(AppError.validation('Error de validación', details));
  }
};

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const details = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    next(AppError.validation('Error de validación en el cuerpo de la petición', details));
  }
};


export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(AppError.badRequest(`'${paramName}' no es un ID válido`, 'INVALID_ID'));
  }
  
  next();
};