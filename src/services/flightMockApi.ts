// Mock flight API simulating backend latency and multi-passenger booking payloads.

export interface Aircraft {
  model: string;
  legroomInches: number;
  baggage: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
  stops: number;
  price: number;
  averagePrice: number;
  isDeal: boolean;
  dealLabel?: string;
  cabin: "Economy" | "Premium" | "Business";
  aircraft: Aircraft;
}

const AIRCRAFT_MODELS = [
  "Boeing 787-9 Dreamliner",
  "Boeing 777-300ER",
  "Airbus A350-900",
  "Airbus A321neo",
  "Boeing 737 MAX 8",
  "Airbus A380-800",
];

export interface PriceAlert {
  flightId: string;
  message: string;
  delta: number;
}

export interface SecondaryUpsell {
  id: string;
  city: string;
  cityCode: string;
  country: string;
  imageUrl: string;
  price: number;
  averagePrice: number;
  durationMinutes: number;
  tagline: string;
}

export interface BookingPayload {
  primaryId: string;
  secondaryId: string | null;
  passengers: Array<{ firstName: string; lastName: string; dob: string; type: string }>;
  addons: Array<{ carryOn: boolean; checkedBag: boolean; priority: boolean }>;
  seats: (string | null)[];
  total: number;
  contact: { email: string; phone: string };
}

export interface BookingResult {
  pnr: string;
  status: "confirmed";
  createdAt: string;
}

import paris from "@/assets/city-paris.jpg";
import tokyo from "@/assets/city-tokyo.jpg";
import nyc from "@/assets/city-nyc.jpg";
import { AIRPORTS, findAirport } from "@/domains/airports/data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const AIRLINES = ["Aero", "Vega", "Nova Air", "Polaris", "Helio"];
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function makeFlight(
  i: number,
  originCode: string,
  destinationCode: string,
  date: string,
  forceDeal = false,
): Flight {
  const o = findAirport(originCode) ?? AIRPORTS[0];
  const d = findAirport(destinationCode) ?? AIRPORTS[1];
  const base = 280 + Math.floor(Math.random() * 600);
  const avg = base + 80 + Math.floor(Math.random() * 200);
  const isDeal = forceDeal || Math.random() < 0.3;
  const price = isDeal ? Math.floor(avg * (0.55 + Math.random() * 0.2)) : base;
  const departHour = 6 + Math.floor(Math.random() * 16);
  const dep = new Date(`${date}T${String(departHour).padStart(2, "0")}:00:00`);
  const dur = 120 + Math.floor(Math.random() * 600);
  const arr = new Date(dep.getTime() + dur * 60000);
  const pct = Math.round((1 - price / avg) * 100);
  return {
    id: `FL-${date}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    airline: rand(AIRLINES),
    flightNumber: `${rand(["AE", "VG", "NV", "PL", "HE"])}${100 + i}`,
    origin: o.city,
    originCode: o.code,
    destination: d.city,
    destinationCode: d.code,
    departTime: dep.toISOString(),
    arriveTime: arr.toISOString(),
    durationMinutes: dur,
    stops: Math.random() < 0.6 ? 0 : 1,
    price,
    averagePrice: avg,
    isDeal,
    dealLabel: isDeal ? `${pct}% Below Average` : undefined,
    cabin: "Economy",
    aircraft: {
      model: rand(AIRCRAFT_MODELS),
      legroomInches: 30 + Math.floor(Math.random() * 5),
      baggage: "1 carry-on + 1 personal item included",
    },
  };
}

export async function fetchFlights(params: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}): Promise<Flight[]> {
  await delay(800);
  const list: Flight[] = [];
  for (let i = 0; i < 7; i++)
    list.push(makeFlight(i, params.origin, params.destination, params.date, i === 1));
  return list.sort((a, b) => a.price - b.price);
}

const PAIRINGS: Record<string, SecondaryUpsell[]> = {
  CDG: [
    {
      id: "sec-rome",
      city: "Rome",
      cityCode: "FCO",
      country: "Italy",
      imageUrl: paris,
      price: 64,
      averagePrice: 140,
      durationMinutes: 130,
      tagline: "Two capitals. One trip.",
    },
    {
      id: "sec-barcelona",
      city: "Barcelona",
      cityCode: "BCN",
      country: "Spain",
      imageUrl: paris,
      price: 79,
      averagePrice: 160,
      durationMinutes: 110,
      tagline: "Mediterranean detour.",
    },
  ],
  HND: [
    {
      id: "sec-kyoto",
      city: "Kyoto",
      cityCode: "UKY",
      country: "Japan",
      imageUrl: tokyo,
      price: 48,
      averagePrice: 120,
      durationMinutes: 80,
      tagline: "Ancient capital, 80 minutes away.",
    },
    {
      id: "sec-osaka",
      city: "Osaka",
      cityCode: "KIX",
      country: "Japan",
      imageUrl: tokyo,
      price: 55,
      averagePrice: 130,
      durationMinutes: 90,
      tagline: "Street food paradise.",
    },
  ],
  JFK: [
    {
      id: "sec-boston",
      city: "Boston",
      cityCode: "BOS",
      country: "USA",
      imageUrl: nyc,
      price: 89,
      averagePrice: 180,
      durationMinutes: 90,
      tagline: "Add a New England weekend.",
    },
    {
      id: "sec-mtl",
      city: "Montreal",
      cityCode: "YUL",
      country: "Canada",
      imageUrl: nyc,
      price: 119,
      averagePrice: 240,
      durationMinutes: 100,
      tagline: "A taste of Europe in North America.",
    },
  ],
};

const RANDOM_CITIES: SecondaryUpsell[] = [
  {
    id: "sec-lis",
    city: "Lisbon",
    cityCode: "LIS",
    country: "Portugal",
    imageUrl: paris,
    price: 72,
    averagePrice: 150,
    durationMinutes: 150,
    tagline: "Pastel sunsets on the Atlantic.",
  },
  {
    id: "sec-ist",
    city: "Istanbul",
    cityCode: "IST",
    country: "Türkiye",
    imageUrl: tokyo,
    price: 99,
    averagePrice: 210,
    durationMinutes: 180,
    tagline: "Where continents meet.",
  },
  {
    id: "sec-mex",
    city: "Mexico City",
    cityCode: "MEX",
    country: "Mexico",
    imageUrl: nyc,
    price: 128,
    averagePrice: 260,
    durationMinutes: 240,
    tagline: "Markets, murals, mezcal.",
  },
];

export async function fetchSecondaryConnections(
  destinationCode: string,
): Promise<SecondaryUpsell[]> {
  await delay(500);
  if (PAIRINGS[destinationCode]) return PAIRINGS[destinationCode];
  return [...RANDOM_CITIES].sort(() => Math.random() - 0.5).slice(0, 2);
}

export async function fetchPriceAlerts(flightId: string): Promise<PriceAlert | null> {
  await delay(300);
  return { flightId, message: "Tracked for 30 days", delta: -42 };
}

export async function submitBooking(payload: BookingPayload): Promise<BookingResult> {
  await delay(900);
  const pnr = Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
  return { pnr, status: "confirmed", createdAt: new Date().toISOString() };
}
