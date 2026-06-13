import { useSyncExternalStore } from "react";
import type { Flight, SecondaryUpsell } from "@/services/flightMockApi";
import {
  ADDON_PRICES,
  SEAT_TIER_PRICE,
  defaultAddons,
  defaultPassenger,
  generatePnr,
  type BookingState,
  type PassengerAddons,
  type PassengerDetails,
  type SeatTier,
} from "@/domains/booking/types";

let state: BookingState = {
  primary: null,
  secondary: null,
  passengerCount: 1,
  passengers: [defaultPassenger(0)],
  addons: [defaultAddons()],
  seats: [null],
  pnr: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function resize<T>(arr: T[], n: number, make: (i: number) => T): T[] {
  if (arr.length === n) return arr;
  if (arr.length > n) return arr.slice(0, n);
  return [...arr, ...Array.from({ length: n - arr.length }, (_, i) => make(arr.length + i))];
}

export const itinerary = {
  get: () => state,
  setPrimary(f: Flight | null, passengerCount?: number) {
    const count = passengerCount ?? state.passengerCount;
    state = {
      ...state,
      primary: f,
      passengerCount: count,
      passengers: resize(state.passengers, count, defaultPassenger),
      addons: resize(state.addons, count, defaultAddons),
      seats: resize(state.seats, count, () => null),
    };
    emit();
  },
  setSecondary(s: SecondaryUpsell | null) {
    state = { ...state, secondary: s };
    emit();
  },
  updatePassenger(i: number, patch: Partial<PassengerDetails>) {
    state = { ...state, passengers: state.passengers.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) };
    emit();
  },
  updateAddon(i: number, patch: Partial<PassengerAddons>) {
    state = { ...state, addons: state.addons.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) };
    emit();
  },
  setSeat(i: number, seatId: string | null) {
    state = { ...state, seats: state.seats.map((s, idx) => (idx === i ? seatId : s)) };
    emit();
  },
  confirm(): string {
    const pnr = generatePnr();
    state = { ...state, pnr };
    emit();
    return pnr;
  },
  clear() {
    state = {
      primary: null,
      secondary: null,
      passengerCount: 1,
      passengers: [defaultPassenger(0)],
      addons: [defaultAddons()],
      seats: [null],
      pnr: null,
    };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useItinerary() {
  return useSyncExternalStore(
    (cb) => itinerary.subscribe(cb),
    () => itinerary.get(),
    () => itinerary.get()
  );
}

export function computeTotals(s: BookingState, seatTierOf: (id: string | null) => SeatTier | null) {
  const flightPrice = (s.primary?.price ?? 0) + (s.secondary?.price ?? 0);
  const flightTotal = flightPrice * s.passengerCount;
  const addonsTotal = s.addons.reduce(
    (sum, a) =>
      sum +
      (a.carryOn ? ADDON_PRICES.carryOn : 0) +
      (a.checkedBag ? ADDON_PRICES.checkedBag : 0) +
      (a.priority ? ADDON_PRICES.priority : 0),
    0
  );
  const seatsTotal = s.seats.reduce((sum, id) => {
    const t = seatTierOf(id);
    return sum + (t ? SEAT_TIER_PRICE[t] : 0);
  }, 0);
  const subtotal = flightTotal + addonsTotal + seatsTotal;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;
  const savings =
    Math.max(0, ((s.primary?.averagePrice ?? 0) - (s.primary?.price ?? 0)) * s.passengerCount) +
    (s.secondary ? Math.max(0, (s.secondary.averagePrice - s.secondary.price) * s.passengerCount) : 0);
  return { flightTotal, addonsTotal, seatsTotal, subtotal, taxes, total, savings };
}
