import { BaseController } from "../../core/http/BaseController";
import { Database } from "../../database/Database";

export class SystemController extends BaseController {
  readonly basePath = "/";

  constructor(
    private readonly database: Database,
    private readonly routes: () => string[],
  ) {
    super();
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.action((_req, res) => {
        this.ok(res, {
          name: "Lunch Route API",
          description: "Smart lunch delivery routing and rider dispatch",
          version: "1.0.0",
          endpoints: this.routes(),
        });
      }),
    );

    this.router.get(
      "/health",
      this.action(async (_req, res) => {
        const startedAt = Date.now();
        let database = "up";
        try {
          await this.database.ping();
        } catch {
          database = "down";
        }
        res.status(database === "up" ? 200 : 503).json({
          data: {
            status: database === "up" ? "ok" : "degraded",
            database,
            latencyMs: Date.now() - startedAt,
            time: new Date().toISOString(),
          },
        });
      }),
    );
  }
}
