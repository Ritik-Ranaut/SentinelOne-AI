const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  const clientMessage = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'An unexpected server error occurred.'
    : message;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack })
  });
};

module.exports = errorHandler;
