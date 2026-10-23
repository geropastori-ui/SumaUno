// Uso: node render.mjs  (genera png/slide-01.png …)
import { createRequire } from "module";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
const dir = path.dirname(fileURLToPath(import.meta.url));
// playwright local o instalado global (npm i -g playwright)
let pw; try { pw = createRequire(import.meta.url)("playwright"); } catch { pw = createRequire(execSync("npm root -g").toString().trim() + "/")("playwright"); }
const { chromium } = pw;
const datos = "null";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
await page.addInitScript(`window.__DATOS__ = ${datos};`);
await page.goto("file://" + path.join(dir, "carrusel.html"));
await page.waitForSelector(".slide");
await page.evaluate(() => document.fonts.ready);
const slides = await page.$$(".slide");
for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(dir, "png", `slide-${String(i + 1).padStart(2, "0")}.png`) });
console.log(`${slides.length} slides`);
await browser.close();
