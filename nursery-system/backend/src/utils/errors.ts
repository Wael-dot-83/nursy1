export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(message: string) {
  return new AppError(404, message);
}

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, message, details);
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(401, message);
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, message);
}
