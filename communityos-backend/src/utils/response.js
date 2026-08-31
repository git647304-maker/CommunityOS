export function successResponse(data, message = 'Success', statusCode = 200) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(message, statusCode = 500, errors = null) {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
}
