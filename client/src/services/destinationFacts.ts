import type { Destination } from "@/services/airportSearch";

export type DestinationBrief = {
  title: string;
  fact: string;
  sourceLabel: string;
};

type CuratedFact = Omit<DestinationBrief, "title">;

const CURATED_FACTS: Record<string, CuratedFact> = {
  SYD: { fact: "Sydney Harbour is known for its Opera House and Harbour Bridge, two of Australia's most recognisable landmarks.", sourceLabel: "Destination fact" },
  LHR: { fact: "London is home to historic neighbourhoods, royal parks, and a skyline shaped by centuries of architecture.", sourceLabel: "Destination fact" },
  CDG: { fact: "Paris sits on the River Seine and is widely known for landmarks including the Eiffel Tower and the Louvre.", sourceLabel: "Destination fact" },
  DXB: { fact: "Dubai is home to the Burj Khalifa, the world's tallest building, and a rapidly evolving modern skyline.", sourceLabel: "Destination fact" },
  SIN: { fact: "Singapore is an island city-state at the southern tip of the Malay Peninsula, known for its gardens and dense urban design.", sourceLabel: "Destination fact" },
  HND: { fact: "Tokyo is Japan's capital and one of the world's largest metropolitan areas, blending historic districts with dense modern neighbourhoods.", sourceLabel: "Destination fact" },
  NRT: { fact: "Tokyo is Japan's capital and one of the world's largest metropolitan areas, blending historic districts with dense modern neighbourhoods.", sourceLabel: "Destination fact" },
  DEL: { fact: "Delhi is India's capital territory and a layered city where Mughal, colonial, and contemporary history meet.", sourceLabel: "Destination fact" },
  JFK: { fact: "New York City is made up of five boroughs and sits where the Hudson and East rivers meet the Atlantic coast.", sourceLabel: "Destination fact" },
  EWR: { fact: "New York City is made up of five boroughs and sits where the Hudson and East rivers meet the Atlantic coast.", sourceLabel: "Destination fact" },
  AMS: { fact: "Amsterdam is known for its concentric canal ring, which forms one of the defining patterns of the historic city centre.", sourceLabel: "Destination fact" },
  IST: { fact: "Istanbul stretches across Europe and Asia, with the Bosphorus dividing the city's two continental sides.", sourceLabel: "Destination fact" },
  CPT: { fact: "Cape Town is framed by Table Mountain and the meeting of the Atlantic Ocean with the Cape Peninsula.", sourceLabel: "Destination fact" },
  SFO: { fact: "San Francisco is known for its steep hills, bay setting, and the Golden Gate Bridge.", sourceLabel: "Destination fact" },
  SEA: { fact: "Seattle sits between Puget Sound and Lake Washington, with Mount Rainier visible from the surrounding region on clear days.", sourceLabel: "Destination fact" },
  YVR: { fact: "Vancouver is set between the Pacific coast and the Coast Mountains, giving the city a distinctive ocean-and-mountain landscape.", sourceLabel: "Destination fact" },
  GRU: { fact: "São Paulo is Brazil's largest city and a major centre for culture, business, food, and the arts.", sourceLabel: "Destination fact" },
  EZE: { fact: "Buenos Aires is known for its broad avenues, European-influenced architecture, and neighbourhoods such as San Telmo and Palermo.", sourceLabel: "Destination fact" },
  DOH: { fact: "Doha sits on the Persian Gulf and is Qatar's capital, with a waterfront skyline shaped by rapid modern development.", sourceLabel: "Destination fact" },
  FRA: { fact: "Frankfurt is known for its dense financial district alongside a historic centre on the Main River.", sourceLabel: "Destination fact" },
};

export function getDestinationBrief(destination: Destination): DestinationBrief | null {
  const curated = destination.iata ? CURATED_FACTS[destination.iata.toUpperCase()] : undefined;
  return curated ? { title: destination.city, ...curated } : null;
}
