import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";

const url = "http://127.0.0.1:5174";
const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5174", "--strictPort"],
  {
    env: { ...process.env, VITE_ENABLE_MOCKS: "true" },
    stdio: "ignore",
  },
);
let chrome;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Vite stopped before Lighthouse could start.");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(500);
    }
  }
  throw new Error("Vite did not become ready within 30 seconds.");
}

try {
  await waitForServer();
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });
  const result = await lighthouse(url, {
    port: chrome.port,
    onlyCategories: ["performance", "accessibility", "best-practices"],
    output: "html",
    logLevel: "error",
  });
  if (!result?.lhr) throw new Error("Lighthouse did not return a report.");

  const targets = {
    performance: 0.9,
    accessibility: 1,
    "best-practices": 0.95,
  };
  let passed = true;
  for (const [category, target] of Object.entries(targets)) {
    const score = result.lhr.categories[category]?.score;
    const measured = score === null || score === undefined ? 0 : score;
    const meetsTarget = measured >= target;
    passed &&= meetsTarget;
    console.log(
      `${category}: ${(measured * 100).toFixed(0)} (target ${(target * 100).toFixed(0)}) ${meetsTarget ? "PASS" : "FAIL"}`,
    );
  }
  if (!passed) process.exitCode = 1;
} finally {
  if (chrome) await chrome.kill();
  server.kill();
}
