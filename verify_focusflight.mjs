import { chromium } from "playwright";

const baseUrl = process.env.FOCUSFLIGHT_URL || "https://3000-iarbvtgn7e3036s3dxdsl-a251dfb8.sg1.manus.computer/";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const transientExternalResourceError = /^Failed to load resource: net::ERR_FAILED$/;
page.on("console", (message) => {
  if (message.type() === "error" && !transientExternalResourceError.test(message.text())) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
const initialSelectionCards = await page.locator(".selection-destination-card").count();
const initialMapCanvases = await page.locator(".leaflet-container").count();
const initialOriginPrompt = await page.getByText("The live map is centred on New York City. Select a starting airport to begin.").count();
const initialTiles = await page.locator(".leaflet-tile-loaded").count();
await page.getByRole("textbox", { name: "Search starting airport" }).fill("SIN");
await page.getByRole("option").first().click();
await page.getByRole("textbox", { name: "Search destination" }).fill("HND");
await page.getByRole("option").first().click();
await page.locator(".leaflet-container").waitFor({ state: "visible" });
await page.waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 0, null, { timeout: 15000 });
await page.getByRole("button", { name: /Start focus flight/i }).waitFor({ state: "visible" });
await page.waitForFunction(() => !document.querySelector(".start-flight-button")?.hasAttribute("disabled"), null, { timeout: 15000 });
const selectingTiles = await page.locator(".leaflet-tile-loaded").count();
const selectingRouteLines = await page.locator(".leaflet-overlay-pane path").count();
const selectedText = await page.locator(".selection-destination-card").innerText();
const durationDisclosureWorked = /(?:direct flight|estimated flight)/i.test(selectedText);
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

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.getByRole("textbox", { name: "Search starting airport" }).fill("SIN");
await page.getByRole("option").first().click();
await page.getByRole("textbox", { name: "Search destination" }).fill("Cambridge, Massachusetts");
await page.getByRole("button", { name: "Search destination" }).click();
await page.locator(".selection-destination-card").waitFor({ state: "visible", timeout: 20000 });
const geocodedText = await page.locator(".selection-destination-card").innerText();
const geocodingWorked = geocodedText.length > 0 && !geocodedText.includes("No place found");

console.log(JSON.stringify({
  selectingTiles,
  initialSelectionCards,
  initialMapCanvases,
  initialOriginPrompt,
  initialTiles,
  selectingRouteLines,
  selectedText,
  durationDisclosureWorked,
  activeTiles,
  activeMarkers,
  timeBeforePause,
  pausedButton,
  timeAfterPause,
  geocodedText,
  geocodingWorked,
  errors,
  pass: initialSelectionCards === 0 && initialMapCanvases === 1 && initialOriginPrompt === 1 && initialTiles > 0 && selectingTiles > 0 && selectingRouteLines > 0 && durationDisclosureWorked && activeTiles > 0 && activeMarkers >= 3 && pausedButton === 1 && timeBeforePause === timeAfterPause && geocodingWorked && errors.length === 0,
}, null, 2));

await browser.close();
