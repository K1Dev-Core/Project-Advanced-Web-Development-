export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): HttpError {
    return new HttpError(400, code, message, details);
  }

  static notFound(message: string, code = "NOT_FOUND"): HttpError {
    return new HttpError(404, code, message);
  }

  static conflict(message: string, code = "CONFLICT", details?: unknown): HttpError {
    return new HttpError(409, code, message, details);
  }

  static unprocessable(message: string, code = "UNPROCESSABLE", details?: unknown): HttpError {
    return new HttpError(422, code, message, details);
  }

  static serviceUnavailable(message: string, code = "SERVICE_UNAVAILABLE"): HttpError {
    return new HttpError(503, code, message);
  }
}
