#!/usr/bin/env node
/**
 * Set Moonshot/Kimi API key in OpenClaw auth-profiles.json (no OpenClaw deps).
 * Usage: MOONSHOT_API_KEY=sk-xxx node set-moonshot-key.js
 */
const fs = require("fs");
const path = require("path");

const key = (process.env.MOONSHOT_API_KEY || "").trim();
if (!key) {
  console.error("Usage: MOONSHOT_API_KEY=sk-xxx node set-moonshot-key.js");
  process.exit(1);
}

const authPath = path.join(
  process.env.OPENCLAW_STATE_DIR || path.join(process.env.HOME || "/root", ".openclaw"),
  "agents",
  "main",
  "agent",
  "auth-profiles.json"
);

let store;
try {
  store = JSON.parse(fs.readFileSync(authPath, "utf8"));
} catch (e) {
  console.error("Could not read", authPath, e.message);
  process.exit(1);
}

store.profiles = store.profiles || {};
store.profiles["moonshot:default"] = {
  type: "api_key",
  provider: "moonshot",
  key,
};
store.lastGood = store.lastGood || {};
store.lastGood.moonshot = "moonshot:default";

fs.writeFileSync(authPath, JSON.stringify(store, null, 2) + "\n", "utf8");
console.log("Moonshot API key saved to auth-profiles.json.");
