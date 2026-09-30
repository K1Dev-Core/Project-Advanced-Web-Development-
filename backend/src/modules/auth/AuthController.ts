import { z } from "zod";
import { BaseController } from "../../core/http/BaseController";
import { AuthGuard } from "./AuthGuard";
import { AuthService } from "./AuthService";

export class AuthController extends BaseController {
  readonly basePath = "/auth";
  readonly requiresAuth = false;

  private static readonly loginSchema = z.object({
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(200),
  });

  constructor(
    private readonly service: AuthService,
    private readonly guard: AuthGuard,
  ) {
    super();
  }

  protected registerRoutes(): void {
    this.router.post(
      "/login",
      this.action((req, res) => {
        const { username, password } = AuthController.loginSchema.parse(req.body ?? {});
        this.ok(res, this.service.login(username, password));
      }),
    );

    this.router.get(
      "/me",
      this.guard.handle,
      this.action((_req, res) => {
        this.ok(res, {
          authEnabled: this.service.enabled,
          user: AuthGuard.user(res) ?? null,
        });
      }),
    );
  }
}
