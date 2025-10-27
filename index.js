import { Command } from "commander";
import fs from "fs/promises";
import http from "http";
import { XMLBuilder } from "fast-xml-parser";
import fsSync from "fs";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "path to input file")
  .requiredOption("-h, --host <host>", "server host address")
  .requiredOption("-p, --port <port>", "server port number");

program.parse(process.argv);
const options = program.opts();

// --- Перевірка існування файлу ---
if (!fsSync.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// --- Створення HTTP-сервера ---
const server = http.createServer(async (req, res) => {
  try {
    // --- 1. Зчитуємо JSON Lines ---
    const rawData = await fs.readFile(options.input, "utf-8");
    const lines = rawData
      .split("\n")
      .filter(line => line.trim() !== "")
      .map(line => JSON.parse(line));

    // --- 2. Параметри запиту ---
    const url = new URL(req.url, `http://${options.host}:${options.port}`);
    const showVariety = url.searchParams.get("variety") === "true";
    const minPetalLength = parseFloat(url.searchParams.get("min_petal_length"));

    // --- 3. Фільтрація ---
    let filtered = lines;
    if (!isNaN(minPetalLength)) {
      filtered = filtered.filter(
        flower => flower["petal.length"] > minPetalLength
      );
    }

    // --- 4. Формуємо дані для XML ---
    const flowers = filtered.map(flower => {
      const f = {
        petal_length: flower["petal.length"],
        petal_width: flower["petal.width"],
      };
      if (showVariety) f.variety = flower.variety;
      return f;
    });

    const xmlData = { irises: { flower: flowers } };

    // --- 5. Будуємо XML ---
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const xmlContent = builder.build(xmlData);

    // --- 6. Відправляємо відповідь ---
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    res.end(xmlContent);

  } catch (err) {
    console.error("Error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
});

// --- 7. Запуск ---
server.listen(options.port, options.host, () => {
  console.log(`✅ Server running at http://${options.host}:${options.port}/`);
});
