# Airport data sources and implementation notes

## Verified sources

The application dataset is generated from the current **OurAirports** public-domain CSV dump:

- Airports CSV: https://davidmegginson.github.io/ourairports-data/airports.csv
- Countries CSV: https://davidmegginson.github.io/ourairports-data/countries.csv
- Dataset documentation: https://ourairports.com/help/data-dictionary.html

OurAirports documents `type`, `name`, `latitude_deg`, `longitude_deg`, `iso_country`, `municipality`, `scheduled_service`, `icao_code`, and `iata_code` as airport fields. The source page states that the dump is updated nightly and released to the public domain, with no guarantee of accuracy.

OpenFlights was cross-checked as a secondary reference for its airport field model and worldwide airport coverage:

- https://openflights.org/data.php

## Dataset policy

The generated app dataset keeps commercial airports with IATA or ICAO codes and scheduled service, plus additional Indian airports with IATA or ICAO codes for strong national coverage. A `priority` field ranks large scheduled airports above medium scheduled airports and other included commercial airports. Search uses `name`, `municipality`, `country`, `iata`, and `icao` values, while the complete source dump remains outside the deployed project.

## Map policy

Selection and active-flight states use Leaflet with OpenStreetMap tiles. The tile URL, attribution, Nominatim endpoint, and default map settings remain isolated in `client/src/config/map.ts` so the provider can be replaced later.
