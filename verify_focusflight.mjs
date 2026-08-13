import { chromium } from "playwright";

const baseUrl = process.env.FOCUSFLIGHT_URL || "https://3000-iarbvtgn7e3036s3dxdsl-a251dfb8.sg1.manus.computer/";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByLabel("Search city or airport").fill("HND");
await page.getByRole("option").first().click();
await page.locator(".leaflet-container").waitFor({ state: "visible" });
await page.waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 0, null, { timeout: 15000 });
const selectingTiles = await page.locator(".leaflet-tile-loaded").count();
const selectingRouteLines = await page.locator(".leaflet-overlay-pane path").count();
const selectedText = await page.locator(".selection-destination-card").innerText();
await page.screenshot({ path: "/home/ubuntu/screenshots/focusflight-selection.png", fullPage: true });

await page.getByRole("button", { name: /Start focus flight/i }).click();
await page.getByRole("button", { name: "Pause flight" }).waitFor({ state: "visible" });
const activeTiles = await page.locator(".leaflet-tile-loaded").count();
const activeMarkers = await page.locator(".leaflet-marker-icon").count();
const timeBeforePause = await page.locator(".time-card strong").innerText();
await page.screenshot({ path: "/home/ubuntu/screenshots/focusflight-active.png", fullPage: true });
await page.getByRole("button", { name: "Pause flight" }).click();
const pausedButton = await page.getByRole("button", { name: "Resume flight" }).count();
await page.waitForTimeout(1200);
const timeAfterPause = await page.locator(".time-card strong").innerText();

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByLabel("Search city or airport").fill("Cambridge, Massachusetts");
await page.getByRole("button", { name: "Search destination" }).click();
await page.locator(".selection-destination-card").waitFor({ state: "visible", timeout: 20000 });
const geocodedText = await page.locator(".selection-destination-card").innerText();
const geocodingWorked = geocodedText.length > 0 && !geocodedText.includes("No place found");

console.log(JSON.stringify({
  selectingTiles,
  selectingRouteLines,
  selectedText,
  activeTiles,
  activeMarkers,
  timeBeforePause,
  pausedButton,
  timeAfterPause,
  geocodedText,
  geocodingWorked,
  errors,
  pass: selectingTiles > 0 && selectingRouteLines > 0 && activeTiles > 0 && activeMarkers >= 3 && pausedButton === 1 && timeBeforePause === timeAfterPause && geocodingWorked && errors.length === 0,
}, null, 2));

await browser.close();
