import { chromium } from "playwright";

const baseUrl = process.env.FOCUSFLIGHT_URL || "https://3000-iarbvtgn7e3036s3dxdsl-a251dfb8.sg1.manus.computer/";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.locator(".leaflet-container").waitFor({ state: "visible" });

await page.getByRole("textbox", { name: "Search starting airport" }).fill("CCU");
await page.getByRole("option").first().click();
await page.getByRole("textbox", { name: "Search destination" }).fill("JFK");
await page.getByRole("option").first().click();

await page.getByRole("button", { name: /Start focus flight/i }).waitFor({ state: "visible" });
await page.waitForFunction(() => !document.querySelector(".start-flight-button")?.hasAttribute("disabled"), null, { timeout: 15000 });

const selectedRoute = await page.locator(".selection-destination-card").innerText();
const selectionPathCount = await page.locator(".leaflet-overlay-pane path").count();

await page.getByRole("button", { name: /Start focus flight/i }).click();
await page.getByRole("button", { name: "Pause flight" }).waitFor({ state: "visible" });
await page.waitForTimeout(1400);

const timerText = await page.locator(".time-card strong").innerText();
const activePathCount = await page.locator(".leaflet-overlay-pane path").count();
const aircraftVisible = (await page.locator(".flight-plane-icon").count()) === 1;
const markersVisible = await page.locator(".leaflet-marker-icon").count();
await page.screenshot({ path: "/home/ubuntu/screenshots/focusflight-ccu-jfk-active.png", fullPage: true });

console.log(JSON.stringify({
  selectedRoute,
  selectionPathCount,
  activePathCount,
  aircraftVisible,
  markersVisible,
  timerText,
  errors,
  pass:
    /CCU/i.test(selectedRoute) &&
    /JFK|New York/i.test(selectedRoute) &&
    selectionPathCount > 0 &&
    activePathCount >= 2 &&
    aircraftVisible &&
    markersVisible >= 3 &&
    /^\d{1,2}:\d{2}:\d{2}$/.test(timerText) &&
    errors.length === 0,
}, null, 2));

await browser.close();
