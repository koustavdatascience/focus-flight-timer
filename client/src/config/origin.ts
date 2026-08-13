/* Cloud Atlas Editorial origin configuration: change this one code to change the default departure airport. */

import { getAirportByCode, type Destination } from "@/services/airportSearch";

export const ORIGIN_AIRPORT_CODE = "SIN";

export const ORIGIN: Destination = (() => {
  const airport = getAirportByCode(ORIGIN_AIRPORT_CODE);
  if (!airport) {
    throw new Error(`Configured origin ${ORIGIN_AIRPORT_CODE} was not found in the airport dataset.`);
  }
  return airport;
})();
