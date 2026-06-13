export interface AdminFlight {
  id: string;
  flightNumber: string;
  route: string;
  departure: string;
  price: number;
  seats: number;
}

export interface AdminBooking {
  pnr: string;
  email: string;
  route: string;
  total: number;
  status: "Confirmed" | "Cancelled" | "Pending";
  date: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  joined: string;
  status: "Active" | "Banned";
}

export const ADMIN_FLIGHTS: AdminFlight[] = [
  { id: "1", flightNumber: "AE101", route: "JFK → CDG", departure: "2026-06-20 18:30", price: 549, seats: 32 },
  { id: "2", flightNumber: "VG204", route: "LAX → HND", departure: "2026-06-21 22:15", price: 812, seats: 18 },
  { id: "3", flightNumber: "NV330", route: "SFO → LHR", departure: "2026-06-22 10:00", price: 678, seats: 44 },
  { id: "4", flightNumber: "PL512", route: "ORD → FCO", departure: "2026-06-23 14:45", price: 489, seats: 9 },
  { id: "5", flightNumber: "HE701", route: "MIA → BCN", departure: "2026-06-24 19:20", price: 599, seats: 27 },
];

export const ADMIN_BOOKINGS: AdminBooking[] = [
  { pnr: "K7M2X9", email: "ada@kim.co", route: "JFK → CDG", total: 1240, status: "Confirmed", date: "2026-06-12" },
  { pnr: "Q4N8L3", email: "ben@kim.co", route: "LAX → HND", total: 1812, status: "Confirmed", date: "2026-06-11" },
  { pnr: "Z9P5R2", email: "cara@kim.co", route: "SFO → LHR", total: 678, status: "Pending", date: "2026-06-10" },
  { pnr: "T3J8W6", email: "dan@kim.co", route: "ORD → FCO", total: 489, status: "Cancelled", date: "2026-06-09" },
  { pnr: "M6V1H4", email: "eve@kim.co", route: "MIA → BCN", total: 1198, status: "Confirmed", date: "2026-06-08" },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: "u1", email: "ada@kim.co", name: "Ada Lovelace", joined: "2025-12-01", status: "Active" },
  { id: "u2", email: "ben@kim.co", name: "Ben Carter", joined: "2026-01-14", status: "Active" },
  { id: "u3", email: "cara@kim.co", name: "Cara Diaz", joined: "2026-02-22", status: "Banned" },
  { id: "u4", email: "dan@kim.co", name: "Dan Evers", joined: "2026-03-09", status: "Active" },
  { id: "u5", email: "eve@kim.co", name: "Eve Fischer", joined: "2026-04-18", status: "Active" },
];
