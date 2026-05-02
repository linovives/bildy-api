import { jest } from '@jest/globals';
import { AppError } from '../src/utils/AppError.js';
import { validate, validateBody, validateObjectId } from '../src/middleware/validate.middleware.js';
import { z } from 'zod';

// APPERROR

describe('AppError static methods', () => {
  test('badRequest crea error 400', () => {
    const err = AppError.badRequest('msg');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('msg');
  });

  test('unauthorized crea error 401', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
  });

  test('forbidden crea error 403', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
  });

  test('notFound crea error 404', () => {
    const err = AppError.notFound('Usuario');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('Usuario');
  });

  test('conflict crea error 409', () => {
    const err = AppError.conflict();
    expect(err.statusCode).toBe(409);
  });

  test('validation crea error 400 con details', () => {
    const err = AppError.validation('Error', [{ field: 'email', message: 'requerido' }]);
    expect(err.statusCode).toBe(400);
    expect(err.details).toHaveLength(1);
  });

  test('tooManyRequests crea error 429', () => {
    const err = AppError.tooManyRequests();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT');
  });

  test('internal crea error 500', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  test('isOperational es true', () => {
    const err = new AppError('test', 400);
    expect(err.isOperational).toBe(true);
  });
});

// VALIDATE MIDDLEWARE

describe('validate middleware', () => {
  const schema = z.object({
    body: z.object({ name: z.string() }),
    query: z.object({}),
    params: z.object({})
  });

  test('llama next() si el body es válido', () => {
    const req = { body: { name: 'Juan' }, query: {}, params: {} };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('llama next con AppError si el body es inválido', () => {
    const req = { body: {}, query: {}, params: {} };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});

// VALIDATE BODY MIDDLEWARE

describe('validateBody middleware', () => {
  const schema = z.object({ name: z.string() });

  test('parsea y llama next() si válido', () => {
    const req = { body: { name: 'Juan' } };
    const next = jest.fn();
    validateBody(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('responde 400 si inválido', () => {
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    validateBody(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('responde 400 con mensaje si error sin issues', () => {
    const badSchema = { parse: () => { throw new Error('custom error'); } };
    const req = { body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    validateBody(badSchema)(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'custom error' });
  });
});

// VALIDATE OBJECT ID MIDDLEWARE

describe('validateObjectId middleware', () => {
  test('llama next() si el id es válido', () => {
    const req = { params: { id: '000000000000000000000000' } };
    const next = jest.fn();
    validateObjectId('id')(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('llama next con AppError si el id es inválido', () => {
    const req = { params: { id: 'invalid-id' } };
    const next = jest.fn();
    validateObjectId('id')(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
