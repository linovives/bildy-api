const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  const code = err.code || 'INTERNAL_ERROR';

  const errorResponse = {
    status,
    code,
    message: err.message || 'Error interno del servidor',
    ...(err.details && { details: err.details })
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;