# FocusFlight flight-duration sources

This project uses a two-tier duration model. The `flight_durations` table and matching browser cache store **verified direct-route durations** where a route-specific schedule page is available. The first verified records were reviewed on 2026-08-13 and expire after six months. Other airport pairs use the disclosed estimate formula in `client/src/services/flightDurations.ts`; they are never described as direct flights.

| Route | Cached duration | Classification | Source |
| --- | ---: | --- | --- |
| CCU → DEL | 2h 45m | Verified direct flight | [FlightsFrom: Kolkata to Delhi](https://www.flightsfrom.com/CCU-DEL) |
| DEL → BOM | 2h 35m | Verified direct flight | [FlightsFrom: Delhi to Mumbai](https://www.flightsfrom.com/DEL-BOM) |
| JFK → LAX | 6h 36m | Verified direct flight | [FlightsFrom: New York to Los Angeles](https://www.flightsfrom.com/JFK-LAX) |

The source pages state that these routes have direct service and provide the listed scheduled flight times. FocusFlight uses these as simulations, not live operational predictions. The browser reads the cache before calculating a fallback, and preserves the duration provenance on each saved trip.
