import cors, { CorsOptions } from "cors";
import express, { Express, NextFunction, Request, Response, Router } from "express";
import { AppConfig } from "../config/AppConfig";
import { ErrorHandler } from "../core/errors/ErrorHandler";
import { SystemController } from "../modules/system/SystemController";
import { Container } from "./Container";

interface RouteLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

export class App {
  static readonly API_PREFIX = "/api";

  private readonly express: Express = express();
  private readonly catalog: string[] = [];

  constructor(
    private readonly config: AppConfig,
    private readonly container: Container,
  ) {}

  static create(config: AppConfig = AppConfig.get()): Express {
    return new App(config, new Container(config)).build();
  }

  build(): Express {
    const errors = new ErrorHandler(!this.config.server.isProduction);

    this.express.disable("x-powered-by");
    this.express.set("trust proxy", true);
    this.express.use(cors(this.corsOptions()));
    this.express.use(express.json({ limit: "1mb" }));
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(this.migrationGate());

    const api = Router();
    for (const controller of this.container.controllers()) {
      api.use(controller.basePath, controller.build());
      this.register(controller.basePath, controller.router);
    }

    const system = new SystemController(this.container.database, () => this.catalog);
    const systemRouter = system.build();
    this.register("", systemRouter);
    this.express.use("/", systemRouter);
    this.express.use(App.API_PREFIX, systemRouter);
    this.express.use(App.API_PREFIX, api);

    this.express.use(errors.notFound);
    this.express.use(errors.handle);
    return this.express;
  }

  private migrationGate() {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!this.config.database.autoMigrate || req.path.endsWith("/health")) {
        next();
        return;
      }
      this.container.migrator
        .runOnce()
        .then(() => next())
        .catch(next);
    };
  }

  private corsOptions(): CorsOptions {
    const origins = this.config.server.corsOrigins;
    if (origins.includes("*")) {
      return { origin: true, credentials: false };
    }
    return {
      origin: (origin, callback) => callback(null, !origin || origins.includes(origin)),
    };
  }

  private register(basePath: string, router: Router): void {
    for (const layer of router.stack as RouteLayer[]) {
      if (!layer.route) {
        continue;
      }
      const methods = Object.keys(layer.route.methods).map((method) => method.toUpperCase());
      const path = `${App.API_PREFIX}${basePath === "/" ? "" : basePath}${layer.route.path === "/" ? "" : layer.route.path}`;
      for (const method of methods) {
        this.catalog.push(`${method} ${path || App.API_PREFIX}`);
      }
    }
  }
}
