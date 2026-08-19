import type { WaypointTicket } from "@/services/onboardingTicket";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '\"': "&quot;",
  })[character] || character);
}

function barcodePattern(seed: string) {
  return Array.from(seed).map((character, index) => {
    const width = 2 + ((character.charCodeAt(0) + index) % 4);
    const gap = 2 + ((character.charCodeAt(0) + index * 3) % 3);
    return `${width},${gap}`;
  }).join(" ");
}

export function createWaypointTicketSvg(ticket: WaypointTicket) {
  const originCode = escapeXml(ticket.originCode);
  const destinationCode = escapeXml(ticket.destinationCode);
  const originCity = escapeXml(ticket.originCity);
  const destinationCity = escapeXml(ticket.destinationCity);
  const flightNumber = escapeXml(ticket.flightNumber);
  const tripCode = escapeXml(ticket.tripCode);
  const departureAt = escapeXml(ticket.departureAt);
  const arrivalAt = escapeXml(ticket.arrivalAt);
  const boardingAt = escapeXml(ticket.boardingAt);
  const originTimezone = escapeXml(ticket.originTimezone);
  const destinationTimezone = escapeXml(ticket.destinationTimezone);
  const barcode = barcodePattern(ticket.tripCode);
  const barcodeBars = barcode.split(" ").map((pair, index) => {
    const [width, gap] = pair.split(",").map(Number);
    const x = 58 + index * 12;
    return `<rect x="${x}" y="570" width="${width}" height="74" fill="#182c42"/><rect x="${x + width}" y="570" width="${gap}" height="74" fill="#fffdf7"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-labelledby="title desc">
  <title id="title">Waypoint focus ticket ${tripCode}</title>
  <desc id="desc">Focus flight from ${originCity} to ${destinationCity}</desc>
  <rect width="900" height="900" fill="#fffdf7"/>
  <rect x="22" y="22" width="856" height="856" rx="12" fill="#fffdf7" stroke="#d6dfe1" stroke-width="2"/>
  <text x="58" y="76" fill="#0d78ce" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3">WAYPOINT FOCUS FLIGHT</text>
  <text x="842" y="76" text-anchor="end" fill="#84929a" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">${tripCode}</text>
  <text x="58" y="144" fill="#182c42" font-family="Georgia, serif" font-size="62" font-weight="600">Your focus flight</text>
  <text x="58" y="186" fill="#182c42" font-family="Arial, sans-serif" font-size="23" font-weight="700" letter-spacing="3">${flightNumber}</text>
  <text x="842" y="186" text-anchor="end" fill="#687884" font-family="Arial, sans-serif" font-size="17">${Math.max(1, Math.round(ticket.durationSeconds / 60))} minutes in the air</text>
  <line x1="58" y1="218" x2="842" y2="218" stroke="#d6dfe1" stroke-width="2"/>
  <text x="58" y="278" fill="#687884" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3">FROM</text>
  <text x="58" y="350" fill="#182c42" font-family="Arial, sans-serif" font-size="72" font-weight="700">${originCode}</text>
  <text x="58" y="382" fill="#34495a" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="1">${originCity}</text>
  <text x="842" y="278" text-anchor="end" fill="#687884" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3">TO</text>
  <text x="842" y="350" text-anchor="end" fill="#182c42" font-family="Arial, sans-serif" font-size="72" font-weight="700">${destinationCode}</text>
  <text x="842" y="382" text-anchor="end" fill="#34495a" font-family="Arial, sans-serif" font-size="19" font-weight="700" letter-spacing="1">${destinationCity}</text>
  <text x="450" y="340" text-anchor="middle" fill="#0d78ce" font-family="Arial, sans-serif" font-size="42">→</text>
  <line x1="58" y1="420" x2="842" y2="420" stroke="#d6dfe1" stroke-width="2"/>
  <text x="58" y="466" fill="#687884" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">DEPARTURE</text>
  <text x="58" y="498" fill="#182c42" font-family="Arial, sans-serif" font-size="18" font-weight="700">${departureAt}</text>
  <text x="58" y="522" fill="#72808a" font-family="Arial, sans-serif" font-size="13">${originTimezone}</text>
  <text x="300" y="466" fill="#687884" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">ARRIVAL</text>
  <text x="300" y="498" fill="#182c42" font-family="Arial, sans-serif" font-size="18" font-weight="700">${arrivalAt}</text>
  <text x="300" y="522" fill="#72808a" font-family="Arial, sans-serif" font-size="13">${destinationTimezone}</text>
  <text x="610" y="466" fill="#687884" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">BOARDING</text>
  <text x="610" y="498" fill="#182c42" font-family="Arial, sans-serif" font-size="18" font-weight="700">${boardingAt}</text>
  <line x1="58" y1="548" x2="842" y2="548" stroke="#182c42" stroke-width="2" stroke-dasharray="7 8"/>
  <text x="450" y="690" text-anchor="middle" fill="#182c42" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="8">BOARDING PASS</text>
  <g>${barcodeBars}</g>
  <text x="450" y="690" text-anchor="middle" fill="#182c42" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="8">BOARDING PASS</text>
  <text x="450" y="744" text-anchor="middle" fill="#8a969c" font-family="Arial, sans-serif" font-size="13">Unique focus ticket · not an airline boarding pass</text>
  <text x="450" y="814" text-anchor="middle" fill="#687884" font-family="Arial, sans-serif" font-size="12" letter-spacing="2">SAVE THIS TICKET FOR YOUR FOCUS JOURNEY</text>
</svg>`;
}

export function downloadWaypointTicket(ticket: WaypointTicket) {
  const blob = new Blob([createWaypointTicketSvg(ticket)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `waypoint-${ticket.tripCode.toLowerCase()}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
