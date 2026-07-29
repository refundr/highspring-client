/**
 * Playwright's HTML report defaults theme to "system" (follows the OS).
 * Rewrite the baked-in default to light-mode after each run.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const reportHtml = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "playwright-report",
  "index.html"
);

export default async function globalTeardown() {
  if (!existsSync(reportHtml)) return;
  let html = readFileSync(reportHtml, "utf8");
  const next = html
    .replace(/var uo=`system`/g, "var uo=`light-mode`")
    .replace(/content=['"]dark light['"]/g, "content='light'");
  if (next !== html) {
    writeFileSync(reportHtml, next);
  }
}
