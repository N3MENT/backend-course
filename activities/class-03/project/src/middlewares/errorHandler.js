function errorBody(status, code, message, details) {
  const body = { error: { code, message, timestamp: new Date().toISOString() } };
  if (details) body.error.details = details;
  return body;
}

export function notFoundHandler(req, res) {
  res.status(404).json(errorBody(404, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.'));
}

export function errorHandler(err, req, res, _next) {
  const isParseError = err.type === 'entity.parse.failed';
  const status = err.status ?? (isParseError ? 400 : 500);
  const code = err.code ?? (isParseError ? 'MALFORMED_JSON' : 'INTERNAL_ERROR');
  const message = err.status
    ? err.message
    : isParseError
      ? 'El cuerpo JSON enviado no es válido.'
      : 'Error interno del servidor.';

  res.status(status).json(errorBody(status, code, message, err.details));
}