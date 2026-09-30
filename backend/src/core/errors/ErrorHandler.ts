import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "./HttpError";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ErrorHandler {
  constructor(private readonly exposeInternalErrors: boolean) {}

  readonly notFound = (req: Request, res: Response): void => {
    this.send(res, 404, {
      error: { code: "ROUTE_NOT_FOUND", message: `Route ${req.method} ${req.path} does not exist` },
    });
  };

  readonly handle = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof HttpError) {
      this.send(res, error.status, {
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }

    if (error instanceof ZodError) {
      this.send(res, 400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request data is invalid",
          details: error.issues.map((issue) => ({
            field: issue.path.join(".") || null,
            message: issue.message,
          })),
        },
      });
      return;
    }

    if (this.isJsonSyntaxError(error)) {
      this.send(res, 400, { error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } });
      return;
    }

    if (this.isDatabaseConnectionError(error)) {
      console.error(error);
      this.send(res, 503, {
        error: { code: "DATABASE_UNAVAILABLE", message: "Database is not reachable" },
      });
      return;
    }

    console.error(error);
    this.send(res, 500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: this.exposeInternalErrors && error instanceof Error ? error.message : undefined,
      },
    });
  };

  private send(res: Response, status: number, body: ErrorBody): void {
    if (res.headersSent) {
      return;
    }
    res.status(status).json(body);
  }

  private isJsonSyntaxError(error: unknown): boolean {
    return error instanceof SyntaxError && "body" in error;
  }

  private isDatabaseConnectionError(error: unknown): boolean {
    const code = (error as { code?: string } | null)?.code;
    return (
      typeof code === "string" &&
      ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "PROTOCOL_CONNECTION_LOST", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR"].includes(code)
    );
  }
}
