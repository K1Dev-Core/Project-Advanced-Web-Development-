import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../core/errors/HttpError";
import { AuthService, AuthUser } from "./AuthService";

export class AuthGuard {
  constructor(private readonly auth: AuthService) {}

  static user(res: Response): AuthUser | undefined {
    return res.locals.user as AuthUser | undefined;
  }

  readonly handle = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.auth.enabled || req.method === "OPTIONS") {
      next();
      return;
    }
    try {
      const header = req.headers.authorization ?? "";
      const [scheme, token] = header.split(" ");
      if (scheme?.toLowerCase() !== "bearer" || !token) {
        throw new HttpError(401, "UNAUTHORIZED", "Owner login is required. Send Authorization: Bearer <token>");
      }
      res.locals.user = this.auth.verify(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
