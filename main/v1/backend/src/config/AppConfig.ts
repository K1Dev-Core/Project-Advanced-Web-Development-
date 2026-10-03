import dotenv from "dotenv";

dotenv.config({ quiet: true });

export interface DatabaseConfig {
  url?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  sslRejectUnauthorized: boolean;
  sslCa?: string;
  connectionLimit: number;
  autoMigrate: boolean;
}

export interface RoutingConfig {
  provider: "osrm" | "estimate";
  osrmUrl: string;
  osrmProfile: string;
  timeoutMs: number;
  concurrency: number;
}

export interface AuthConfig {
  enabled: boolean;
  ownerUsername: string;
  ownerPassword?: string;
  jwtSecret?: string;
  tokenTtlHours: number;
}

export interface ServerConfig {
  port: number;
  timezone: string;
  corsOrigins: string[];
  isProduction: boolean;
}

export class AppConfig {
  private static instance?: AppConfig;

  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly routing: RoutingConfig;
  readonly auth: AuthConfig;

  private constructor(env: NodeJS.ProcessEnv) {
    this.server = {
      port: AppConfig.toNumber(env.PORT, 3000),
      timezone: env.APP_TIMEZONE || "Asia/Bangkok",
      corsOrigins: AppConfig.toList(env.CORS_ORIGINS, ["*"]),
      isProduction: env.NODE_ENV === "production" || Boolean(env.VERCEL),
    };
    this.database = {
      url: env.DATABASE_URL || undefined,
      host: env.DB_HOST || "localhost",
      port: AppConfig.toNumber(env.DB_PORT, 3306),
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "",
      database: env.DB_NAME || "lunchroute",
      ssl: AppConfig.toBoolean(env.DB_SSL, false),
      sslRejectUnauthorized: AppConfig.toBoolean(env.DB_SSL_REJECT_UNAUTHORIZED, true),
      sslCa: env.DB_SSL_CA ? env.DB_SSL_CA.replace(/\\n/g, "\n") : undefined,
      connectionLimit: AppConfig.toNumber(env.DB_CONNECTION_LIMIT, 5),
      autoMigrate: AppConfig.toBoolean(env.DB_AUTO_MIGRATE, true),
    };
    this.routing = {
      provider: env.ROUTING_PROVIDER === "estimate" ? "estimate" : "osrm",
      osrmUrl: (env.OSRM_URL || "https://router.project-osrm.org").replace(/\/+$/, ""),
      osrmProfile: env.OSRM_PROFILE || "driving",
      timeoutMs: AppConfig.toNumber(env.ROUTING_TIMEOUT_MS, 8000),
      concurrency: AppConfig.toNumber(env.ROUTING_CONCURRENCY, 4),
    };
    this.auth = {
      enabled: AppConfig.toBoolean(env.AUTH_ENABLED, true),
      ownerUsername: env.OWNER_USERNAME || "owner",
      ownerPassword: env.OWNER_PASSWORD || undefined,
      jwtSecret: env.JWT_SECRET || undefined,
      tokenTtlHours: AppConfig.toNumber(env.JWT_TTL_HOURS, 12),
    };
  }

  static get(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig(process.env);
    }
    return AppConfig.instance;
  }

  private static toNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
  }

  private static toBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined || value === "") {
      return fallback;
    }
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  }

  private static toList(value: string | undefined, fallback: string[]): string[] {
    if (!value) {
      return fallback;
    }
    const items = value.split(",").map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }
}
