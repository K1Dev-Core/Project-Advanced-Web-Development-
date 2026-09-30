import { createHash, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { AuthConfig } from "../../config/AppConfig";
import { HttpError } from "../../core/errors/HttpError";

export interface AuthUser {
  username: string;
  role: "owner";
}

export interface LoginResult {
  token: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: AuthUser;
}

export class AuthService {
  private static readonly ISSUER = "khaokong-api";

  constructor(private readonly config: AuthConfig) {}

  get enabled(): boolean {
    return this.config.enabled;
  }

  login(username: string, password: string): LoginResult {
    const { secret, ownerPassword } = this.requireConfigured();
    const validUser = AuthService.safeEqual(username, this.config.ownerUsername);
    const validPassword = AuthService.safeEqual(password, ownerPassword);
    if (!validUser || !validPassword) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Username or password is incorrect");
    }

    const expiresInSeconds = Math.round(this.config.tokenTtlHours * 3600);
    const user: AuthUser = { username: this.config.ownerUsername, role: "owner" };
    const token = jwt.sign(user, secret, {
      algorithm: "HS256",
      expiresIn: expiresInSeconds,
      issuer: AuthService.ISSUER,
      subject: user.username,
    });
    return {
      token,
      tokenType: "Bearer",
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      user,
    };
  }

  verify(token: string): AuthUser {
    const { secret } = this.requireConfigured();
    try {
      const payload = jwt.verify(token, secret, { algorithms: ["HS256"], issuer: AuthService.ISSUER }) as jwt.JwtPayload;
      if (payload.role !== "owner" || typeof payload.username !== "string") {
        throw new Error("Unexpected token payload");
      }
      return { username: payload.username, role: "owner" };
    } catch (error) {
      const expired = error instanceof jwt.TokenExpiredError;
      throw new HttpError(
        401,
        expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        expired ? "Session expired, please log in again" : "Access token is invalid",
      );
    }
  }

  private requireConfigured(): { secret: string; ownerPassword: string } {
    const secret = this.config.jwtSecret;
    const ownerPassword = this.config.ownerPassword;
    if (!secret || !ownerPassword) {
      throw HttpError.serviceUnavailable(
        "Owner login is not configured. Set OWNER_PASSWORD and JWT_SECRET.",
        "AUTH_NOT_CONFIGURED",
      );
    }
    return { secret, ownerPassword };
  }

  private static safeEqual(a: string, b: string): boolean {
    const left = createHash("sha256").update(a).digest();
    const right = createHash("sha256").update(b).digest();
    return timingSafeEqual(left, right);
  }
}
