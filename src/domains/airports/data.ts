export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
  region: string;
}

export const AIRPORTS: Airport[] = [
  { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl", country: "USA", region: "California" },
  { code: "SFO", city: "San Francisco", name: "San Francisco Intl", country: "USA", region: "California" },
  { code: "SAN", city: "San Diego", name: "San Diego Intl", country: "USA", region: "California" },
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "USA", region: "New York" },
  { code: "EWR", city: "Newark", name: "Newark Liberty Intl", country: "USA", region: "New York" },
  { code: "ORD", city: "Chicago", name: "O'Hare Intl", country: "USA", region: "Illinois" },
  { code: "MIA", city: "Miami", name: "Miami Intl", country: "USA", region: "Florida" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma Intl", country: "USA", region: "Washington" },
  { code: "BOS", city: "Boston", name: "Logan Intl", country: "USA", region: "Massachusetts" },
  { code: "LHR", city: "London", name: "Heathrow", country: "UK", region: "England" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France", region: "Île-de-France" },
  { code: "FCO", city: "Rome", name: "Fiumicino", country: "Italy", region: "Lazio" },
  { code: "BCN", city: "Barcelona", name: "El Prat", country: "Spain", region: "Catalonia" },
  { code: "HND", city: "Tokyo", name: "Haneda", country: "Japan", region: "Kanto" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "Singapore", region: "Singapore" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl", country: "UAE", region: "Dubai" },
  { code: "SYD", city: "Sydney", name: "Kingsford Smith", country: "Australia", region: "New South Wales" },
];

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, limit);
  return AIRPORTS.filter((a) =>
    [a.code, a.city, a.name, a.country, a.region].some((f) => f.toLowerCase().includes(q))
  ).slice(0, limit);
}

export function findAirport(codeOrCity: string): Airport | undefined {
  const q = codeOrCity.trim().toLowerCase();
  return AIRPORTS.find((a) => a.code.toLowerCase() === q || a.city.toLowerCase() === q);
}
