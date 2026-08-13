import { chromium } from "playwright";

const baseUrl = process.env.FOCUSFLIGHT_URL || "https://3000-iarbvtgn7e3036s3dxdsl-a251dfb8.sg1.manus.computer/";
const destinations = ["DEL", "BLR", "BOM", "DXB", "LHR", "JFK", "YYC", "ACA"];
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const results = [];

for (const destination of destinations) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Search starting airport" }).fill("CCU");
  await page.getByRole("option").first().click();
  await page.getByRole("textbox", { name: "Search destination" }).fill(destination);
  await page.getByRole("option").first().click();
  await page.waitForFunction(() => document.querySelectorAll(".leaflet-overlay-pane path").length > 0, null, { timeout: 15000 });

  const initialPathCount = await page.locator(".leaflet-overlay-pane path").count();
  const initialPathsValid = await page.locator(".leaflet-overlay-pane path").evaluateAll((paths) => paths.every((path) => {
    const d = path.getAttribute("d") || "";
    return d.length > 2 && !/NaN|Infinity/.test(d);
  }));
  await page.locator(".leaflet-control-zoom-in").click();
  await page.waitForTimeout(350);
  const zoomedPathCount = await page.locator(".leaflet-overlay-pane path").count();
  const zoomedPathsValid = await page.locator(".leaflet-overlay-pane path").evaluateAll((paths) => paths.every((path) => {
    const d = path.getAttribute("d") || "";
    return d.length > 2 && !/NaN|Infinity/.test(d);
  }));

  results.push({ destination, initialPathCount, zoomedPathCount, initialPathsValid, zoomedPathsValid });
}

const pass = results.every((route) => route.initialPathCount > 0 && route.zoomedPathCount > 0 && route.initialPathsValid && route.zoomedPathsValid);
console.log(JSON.stringify({ results, pass }, null, 2));
await browser.close();
if (!pass) process.exitCode = 1;
