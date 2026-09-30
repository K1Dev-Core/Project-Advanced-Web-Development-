import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { HttpError } from "../errors/HttpError";

export interface ResponseMeta {
  [key: string]: unknown;
}

type Action = (req: Request, res: Response) => Promise<void> | void;

export abstract class BaseController {
  readonly router: Router = Router();

  abstract readonly basePath: string;

  readonly requiresAuth: boolean = true;

  protected abstract registerRoutes(): void;

  build(): Router {
    this.registerRoutes();
    return this.router;
  }

  protected action(handler: Action): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve()
        .then(() => handler.call(this, req, res))
        .catch(next);
    };
  }

  protected ok<T>(res: Response, data: T, meta?: ResponseMeta): void {
    res.status(200).json(meta ? { data, meta } : { data });
  }

  protected created<T>(res: Response, data: T): void {
    res.status(201).json({ data });
  }

  protected noContent(res: Response): void {
    res.status(204).end();
  }

  protected idParam(req: Request, name = "id"): number {
    const value = Number(req.params[name]);
    if (!Number.isInteger(value) || value <= 0) {
      throw HttpError.badRequest(`Parameter "${name}" must be a positive integer`, "INVALID_ID");
    }
    return value;
  }
}
