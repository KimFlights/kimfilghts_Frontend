// Flight API service — connects to the KimFlights Spring Boot backend.
// fetchFlights() is wired to the real API.
// Other functions are still mocked until their backend endpoints are built.

import paris from "@/assets/city-paris.jpg";
import tokyo from "@/assets/city-tokyo.jpg";
import nyc from "@/assets/city-nyc.jpg";
import { apiRequest } from "@/lib/apiClient";

// ---------------------------------------------------------------
// Shared interfaces
// ---------------------------------------------------------------

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
  seatCapacity: number;
  isDeal: boolean;
  dealLabel?: string;
  cabin: "Economy" | "Premium" | "Business";
  aircraft: Aircraft;
}

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
  seats: { primary: (string | null)[]; connecting: (string | null)[] };
  total: number;
  contact: { email: string; phone: string; card: string; expiry: string; cvc: string; name: string };
}

export interface BookingResult {
  pnr: string;
  status: string;
  createdAt: string;
}

export interface UserBooking {
  bookingReference: string;
  totalPrice: number;
  passengers: Array<{
    name: string;
    tickets: Array<{
      ticketCode: string;
      seatNum: string;
    }>;
  }>;
}

// ---------------------------------------------------------------
// Backend DTO shape — what /flight/search returns
// ---------------------------------------------------------------

interface BackendFlight {
  id: string;
  departureDate: string;
  arrivalDate: string;
  distance: number | null;
  estimatedTimeInMinutes: number;
  flightStatus: string;
  aircraftName: string | null;
  airlineName: string;
  originAirportCode: string;
  destinationAirportCode: string;
  seatCapacity: number | string | null;
}

function mapBackendFlight(bf: BackendFlight): Flight {
  const dep = new Date(bf.departureDate);
  const arr = new Date(bf.arrivalDate);
  const dur = bf.estimatedTimeInMinutes;
  // TODO: price should come from the backend once pricing is modelled
  const price = 280 + Math.floor(Math.random() * 400);
  const avg = price + 80 + Math.floor(Math.random() * 200);
  return {
    id: bf.id,
    airline: bf.airlineName,
    flightNumber: bf.id.split("-")[0] ?? bf.id,
    origin: bf.originAirportCode,
    originCode: bf.originAirportCode,
    destination: bf.destinationAirportCode,
    destinationCode: bf.destinationAirportCode,
    departTime: dep.toISOString(),
    arriveTime: arr.toISOString(),
    durationMinutes: dur,
    stops: 0,
    price,
    averagePrice: avg,
    seatCapacity: Number(bf.seatCapacity) || 114,
    isDeal: false,
    cabin: "Economy",
    aircraft: {
      model: bf.aircraftName ?? "Unknown Aircraft",
      legroomInches: 31,
      baggage: "1 carry-on + 1 personal item included",
    },
  };
}

// ---------------------------------------------------------------
// fetchFlights — REAL API (GET /flight/search)
// ---------------------------------------------------------------

export async function fetchFlights(params: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}): Promise<Flight[]> {
  const qs = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    passengers: String(params.passengers),
  });
  const backendFlights = await apiRequest<BackendFlight[]>(`/api/flight?${qs.toString()}`);
  return backendFlights.map(mapBackendFlight).sort((a, b) => a.price - b.price);
}

export async function fetchOccupiedSeats(flightId: string): Promise<Set<string>> {
  try {
    const seats = await apiRequest<string[]>(
      `/api/bookings/flight/${encodeURIComponent(flightId)}/seats`,
    );
    return new Set(seats.filter(Boolean));
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------
// Mocked functions — TODO: connect to backend endpoints
// ---------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PAIRINGS: Record<string, SecondaryUpsell[]> = {
  CDG: [
    { id: "sec-rome", city: "Rome", cityCode: "FCO", country: "Italy", imageUrl: paris, price: 64, averagePrice: 140, durationMinutes: 130, tagline: "Two capitals. One trip." },
    { id: "sec-barcelona", city: "Barcelona", cityCode: "BCN", country: "Spain", imageUrl: paris, price: 79, averagePrice: 160, durationMinutes: 110, tagline: "Mediterranean detour." },
  ],
  HND: [
    { id: "sec-kyoto", city: "Kyoto", cityCode: "UKY", country: "Japan", imageUrl: tokyo, price: 48, averagePrice: 120, durationMinutes: 80, tagline: "Ancient capital, 80 minutes away." },
    { id: "sec-osaka", city: "Osaka", cityCode: "KIX", country: "Japan", imageUrl: tokyo, price: 55, averagePrice: 130, durationMinutes: 90, tagline: "Street food paradise." },
  ],
  JFK: [
    { id: "sec-boston", city: "Boston", cityCode: "BOS", country: "USA", imageUrl: nyc, price: 89, averagePrice: 180, durationMinutes: 90, tagline: "Add a New England weekend." },
    { id: "sec-mtl", city: "Montreal", cityCode: "YUL", country: "Canada", imageUrl: nyc, price: 119, averagePrice: 240, durationMinutes: 100, tagline: "A taste of Europe in North America." },
  ],
};

const RANDOM_CITIES: SecondaryUpsell[] = [
  { id: "sec-lis", city: "Lisbon", cityCode: "LIS", country: "Portugal", imageUrl: paris, price: 72, averagePrice: 150, durationMinutes: 150, tagline: "Pastel sunsets on the Atlantic." },
  { id: "sec-ist", city: "Istanbul", cityCode: "IST", country: "Türkiye", imageUrl: tokyo, price: 99, averagePrice: 210, durationMinutes: 180, tagline: "Where continents meet." },
  { id: "sec-mex", city: "Mexico City", cityCode: "MEX", country: "Mexico", imageUrl: nyc, price: 128, averagePrice: 260, durationMinutes: 240, tagline: "Markets, murals, mezcal." },
];

// TODO: connect to GET /flight/{code}/connections or similar endpoint
export async function fetchSecondaryConnections(
  destinationCode: string,
): Promise<SecondaryUpsell[]> {
  await delay(500);
  if (PAIRINGS[destinationCode]) return PAIRINGS[destinationCode];
  return [...RANDOM_CITIES].sort(() => Math.random() - 0.5).slice(0, 2);
}

// TODO: connect to GET /flight/{id}/price-alert endpoint
export async function fetchPriceAlerts(flightId: string): Promise<PriceAlert | null> {
  await delay(300);
  return { flightId, message: "Tracked for 30 days", delta: -42 };
}

// ---------------------------------------------------------------
// Payment & Booking Integration
// ---------------------------------------------------------------

export async function fetchCardBrand(bin: string): Promise<string> {
  if (!bin || bin.length < 6) return "";
  try {
    // The backend returns a plain string, not JSON
    const response = await apiRequest<string>(`/api/payment/brand/${bin}`);
    return response || "";
  } catch (e) {
    return "";
  }
}

export async function fetchUserBookings(): Promise<UserBooking[]> {
  try {
    return await apiRequest<UserBooking[]>("/api/bookings/my-bookings");
  } catch (e) {
    return [];
  }
}

export async function submitBooking(payload: BookingPayload): Promise<BookingResult> {
  // Guard: every passenger must have a seat selected
  const missingSeat = payload.seats.primary.findIndex((s) => !s);
  if (missingSeat !== -1) {
    throw new Error(
      `Passenger ${missingSeat + 1} has no seat selected. Please go back and choose a seat for all passengers.`,
    );
  }

  // 1. Create Booking
  const createReq = {
    passengers: payload.passengers.map((p, i) => ({
      name: `${p.firstName} ${p.lastName}`,
      passportNumber: `P${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: {
        street: "123 Main St",
        city: "Metropolis",
        state: "NY",
        country: "USA",
        postalCode: "10001",
      },
      tickets: [
        {
          ticketCode: `TKT-${Math.floor(Math.random() * 10000)}`,
          type: "Economy",
          price: payload.total / payload.passengers.length,
          availability: "RESERVED",
          flightId: payload.primaryId,
          seatNum: payload.seats.primary[i]!, // guaranteed non-null by guard above
        },
      ],
      luggage: payload.addons[i]?.checkedBag
        ? [
            {
              weight: 23,
              type: "CHECKED",
              price: 70,
            },
          ]
        : [],
    })),
  };

  const bookingRes = await apiRequest<{ bookingReference: string; status: string }>(
    "/api/bookings",
    {
      method: "POST",
      body: JSON.stringify(createReq),
    },
  );

  const bookingRef = bookingRes.bookingReference;

  // 2. Create Invoice
  const invoiceRes = await apiRequest<{ id: number }>(`/api/invoice/${bookingRef}`, {
    method: "POST",
  });

  // 3. Pay
  const paymentRes = await apiRequest<{ id: number; status: string; failureReason?: string }>("/api/payment/pay", {
    method: "POST",
    body: JSON.stringify({
      cardNumber: payload.contact.card.replace(/\s+/g, ""),
      invoiceId: invoiceRes.id,
    }),
  });

  if (paymentRes.status === "FAILED") {
    throw new Error(paymentRes.failureReason || "Payment declined");
  }

  return { pnr: bookingRef, status: "confirmed", createdAt: new Date().toISOString() };
}
