import type { Flight, SecondaryUpsell } from "@/services/flightMockApi";

export type PassengerType = "adult" | "child";

export interface PassengerDetails {
  id: string;
  type: PassengerType;
  firstName: string;
  lastName: string;
  dob: string;
}

export interface PassengerAddons {
  carryOn: boolean;
  checkedBag: boolean;
  priority: boolean;
}

export const ADDON_PRICES = {
  carryOn: 0,
  checkedBag: 45,
  priority: 25,
};

export type SeatTier = "business" | "plus" | "economy";
export const SEAT_TIER_PRICE: Record<SeatTier, number> = {
  business: 300,
  plus: 60,
  economy: 0,
};

export interface Seat {
  id: string;
  row: number;
  col: string;
  tier: SeatTier;
  occupied: boolean;
}

export type SegmentKey = "primary" | "connecting";

export interface BookingState {
  primary: Flight | null;
  secondary: SecondaryUpsell | null;
  passengerCount: number;
  passengers: PassengerDetails[];
  addons: PassengerAddons[];
  selectedSeats: Record<SegmentKey, (string | null)[]>;
  pnr: string | null;
}

export function generatePnr(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function defaultPassenger(i: number): PassengerDetails {
  return {
    id: `p-${i}-${Math.random().toString(36).slice(2, 7)}`,
    type: i === 0 ? "adult" : "adult",
    firstName: "",
    lastName: "",
    dob: "",
  };
}
export function defaultAddons(): PassengerAddons {
  return { carryOn: true, checkedBag: false, priority: false };
}
