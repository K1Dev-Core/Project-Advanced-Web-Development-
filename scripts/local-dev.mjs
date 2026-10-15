import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  openSync,
} from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createConnection } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const local = path.join(root, ".local");
mkdirSync(local, { recursive: true });
if (process.argv.includes("--detach")) {
  const log = openSync(path.join(local, "launcher.log"), "a");
  spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: root,
    detached: true,
    stdio: ["ignore", log, log],
  }).unref();
  console.log(
    "Starting local services in the background. Logs: .local/launcher.log",
  );
  process.exit(0);
}
const socket = path.join(local, "mysql.sock");
const data = path.join(local, "mysql");
const children = [];
function running(port) {
  return new Promise((resolve) => {
    const s = createConnection({ port, host: "127.0.0.1" });
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
  });
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0)
    throw new Error(result.stderr || `Failed to run ${command}.`);
  return result;
}
async function wait(port) {
  for (let i = 0; i < 120; i++) {
    if (await running(port)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `Service on port ${port} did not start; inspect .local logs.`,
  );
}
function start(command, args, cwd, log) {
  const fd = openSync(path.join(local, log), "a");
  const child = spawn(command, args, { cwd, stdio: ["ignore", fd, fd] });
  children.push(child);
  return child;
}
if (!existsSync(path.join(root, "backend/node_modules")))
  run("npm", ["ci", "--prefix", "backend"]);
if (!existsSync(path.join(root, "frontend/node_modules")))
  run("npm", ["ci", "--prefix", "frontend"]);
if (!(await running(33307))) {
  if (!existsSync(path.join(data, "mysql"))) {
    mkdirSync(data, { recursive: true });
    run("mysqld", [
      "--no-defaults",
      "--initialize-insecure",
      `--datadir=${data}`,
      `--log-error=${local}/mysql-init.log`,
    ]);
  }
  start(
    "mysqld",
    [
      "--no-defaults",
      `--datadir=${data}`,
      "--port=33307",
      "--bind-address=127.0.0.1",
      `--socket=${socket}`,
      "--mysqlx=OFF",
      `--log-error=${local}/mysql.log`,
      `--pid-file=${local}/mysql.pid`,
    ],
    root,
    "mysql-process.log",
  );
  await wait(33307);
}
const envPath = path.join(root, "backend/.env");
if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    `PORT=3000\nAPP_TIMEZONE=Asia/Bangkok\nCORS_ORIGINS=http://127.0.0.1:4201,http://localhost:4201\nDB_HOST=127.0.0.1\nDB_PORT=33307\nDB_USER=songsook\nDB_PASSWORD=${randomBytes(24).toString("hex")}\nDB_NAME=songsook_local\nDB_AUTO_MIGRATE=true\nAUTH_ENABLED=true\nOWNER_USERNAME=owner\nOWNER_PASSWORD=${randomBytes(18).toString("base64url")}\nJWT_SECRET=${randomBytes(48).toString("hex")}\nROUTING_PROVIDER=osrm\nROUTING_TIMEOUT_MS=10000\n`,
    { mode: 0o600 },
  );
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
if (
  env.DB_NAME !== "songsook_local" ||
  env.DB_PORT !== "33307" ||
  env.DB_HOST !== "127.0.0.1"
)
  throw new Error(
    "Existing backend/.env is not the isolated local database; it was preserved.",
  );
const quote = (s) =>
  "'" + s.replaceAll("\\", "\\\\").replaceAll("'", "''") + "'";
const rootConfig = path.join(local, "mysql-client.cnf");
let rootPass;
if (!existsSync(rootConfig)) rootPass = randomBytes(32).toString("hex");
const args = existsSync(rootConfig)
  ? [`--defaults-extra-file=${rootConfig}`]
  : ["--no-defaults", `--socket=${socket}`, "-uroot"];
const sql =
  `CREATE DATABASE IF NOT EXISTS songsook_local CHARACTER SET utf8mb4; CREATE USER IF NOT EXISTS 'songsook'@'127.0.0.1' IDENTIFIED BY ${quote(env.DB_PASSWORD)}; GRANT ALL PRIVILEGES ON songsook_local.* TO 'songsook'@'127.0.0.1';` +
  (rootPass
    ? `ALTER USER 'root'@'localhost' IDENTIFIED BY ${quote(rootPass)};`
    : "");
run("mysql", args, { input: sql });
if (rootPass)
  writeFileSync(
    rootConfig,
    `[client]\nuser=root\npassword=${rootPass}\nsocket=${socket}\n`,
    { mode: 0o600 },
  );
run("npm", ["run", "db:bootstrap-local", "--prefix", "backend"]);
writeFileSync(
  path.join(local, "ACCESS.md"),
  `# บัญชีเจ้าของร้านในเครื่อง\n\nเว็บ: http://127.0.0.1:4201/admin/login\n\nชื่อผู้ใช้: ${env.OWNER_USERNAME}\n\nรหัสผ่าน: ${env.OWNER_PASSWORD}\n\nข้อมูลนี้ใช้เฉพาะระบบในเครื่องนี้ ไฟล์ไม่ได้ถูก commit เข้า Git\n`,
  { mode: 0o600 },
);
if (!(await running(3000)))
  start("npm", ["run", "dev"], path.join(root, "backend"), "backend.log");
await wait(3000);
if (!(await running(4201)))
  start(
    "npm",
    ["run", "start:local", "--", "--port", "4201"],
    path.join(root, "frontend"),
    "frontend.log",
  );
await wait(4201);
console.log(
  "Ready: http://127.0.0.1:4201 — MySQL 33307, API 3000. Local owner credentials: .local/ACCESS.md",
);
console.log(
  "Ctrl+C stops only the services started by this command. Logs are in .local/.",
);
const stop = () => {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
if (children.length) await new Promise(() => {});
