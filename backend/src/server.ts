import http from "http";
import { App } from "./app/App";
import { AppConfig } from "./config/AppConfig";

const config = AppConfig.get();
const server = http.createServer(App.create(config));

server
  .listen(config.server.port, () => {
    console.log(`Lunch Route API is running on http://localhost:${config.server.port}/api`);
  })
  .on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
