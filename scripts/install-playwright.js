/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const playwrightCli = path.join(
  path.dirname(require.resolve("playwright/package.json")),
  "cli.js"
);

const result = spawnSync(
  process.execPath,
  [playwrightCli, "install", "chromium"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: "0",
    },
  }
);

process.exit(result.status ?? 1);
