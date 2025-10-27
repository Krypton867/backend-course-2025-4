import { Command } from "commander";
import fs from "fs";
import http from "http";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "path to input file")
  .requiredOption("-h, --host <host>", "server host address")
  .requiredOption("-p, --port <port>", "server port number");

program.parse(process.argv);

const options = program.opts();

// --- Перевірка існування файлу ---
if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// --- Перевірка параметрів ---
if (!options.host || !options.port) {
  console.error("Missing required parameter: host or port");
  process.exit(1);
}

// --- Створення HTTP-сервера ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Server is running successfully");
});

// --- Запуск сервера ---
server.listen(options.port, options.host, () => {
  console.log(`✅ Server running at http://${options.host}:${options.port}/`);
});
