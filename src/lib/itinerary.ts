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
  type SegmentKey,
} from "@/domains/booking/types";

const STORAGE_KEY = "kf:itinerary";

const initialState: BookingState = {
  primary: null,
  secondary: null,
  passengerCount: 1,
  passengers: [defaultPassenger(0)],
  addons: [defaultAddons()],
  selectedSeats: { primary: [null], connecting: [null] },
  pnr: null,
};

function loadState(): BookingState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    // Backward-compat: migrate old flat `seats` array.
    if (parsed && Array.isArray(parsed.seats) && !parsed.selectedSeats) {
      parsed.selectedSeats = {
        primary: parsed.seats,
        connecting: parsed.seats.map(() => null),
      };
      delete parsed.seats;
    }
    return { ...initialState, ...parsed } as BookingState;
  } catch {
    return initialState;
  }
}

let state: BookingState = loadState();

const listeners = new Set<() => void>();
const emit = () => {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
};

function resize<T>(arr: T[], n: number, make: (i: number) => T): T[] {
  if (arr.length === n) return arr;
  if (arr.length > n) return arr.slice(0, n);
  return [...arr, ...Array.from({ length: n - arr.length }, (_, i) => make(arr.length + i))];
}

function resizeSeats(
  seats: Record<SegmentKey, (string | null)[]>,
  n: number,
): Record<SegmentKey, (string | null)[]> {
  return {
    primary: resize(seats.primary, n, () => null),
    connecting: resize(seats.connecting, n, () => null),
  };
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
      selectedSeats: {
        primary: Array.from({ length: count }, () => null),
        connecting: Array.from({ length: count }, () => null),
      },
    };
    emit();
  },
  setSecondary(s: SecondaryUpsell | null) {
    // Purge connecting seats whenever the secondary leg changes or is removed.
    state = {
      ...state,
      secondary: s,
      selectedSeats: {
        ...state.selectedSeats,
        connecting: state.selectedSeats.connecting.map(() => null),
      },
    };
    emit();
  },
  updatePassenger(i: number, patch: Partial<PassengerDetails>) {
    state = {
      ...state,
      passengers: state.passengers.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    };
    emit();
  },
  updateAddon(i: number, patch: Partial<PassengerAddons>) {
    state = {
      ...state,
      addons: state.addons.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    };
    emit();
  },
  setSeat(segment: SegmentKey, i: number, seatId: string | null) {
    state = {
      ...state,
      selectedSeats: {
        ...state.selectedSeats,
        [segment]: state.selectedSeats[segment].map((s, idx) => (idx === i ? seatId : s)),
      },
    };
    emit();
  },
  clearSegmentSeats(segment: SegmentKey) {
    state = {
      ...state,
      selectedSeats: {
        ...state.selectedSeats,
        [segment]: state.selectedSeats[segment].map(() => null),
      },
    };
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
      selectedSeats: { primary: [null], connecting: [null] },
      pnr: null,
    };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useItinerary() {
  return useSyncExternalStore(
    (cb) => itinerary.subscribe(cb),
    () => itinerary.get(),
    () => initialState,
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
    0,
  );
  const sumSeats = (arr: (string | null)[]) =>
    arr.reduce((sum, id) => {
      const t = seatTierOf(id);
      return sum + (t ? SEAT_TIER_PRICE[t] : 0);
    }, 0);
  const seatsTotal =
    sumSeats(s.selectedSeats.primary) + (s.secondary ? sumSeats(s.selectedSeats.connecting) : 0);
  const subtotal = flightTotal + addonsTotal + seatsTotal;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;
  const savings =
    Math.max(0, ((s.primary?.averagePrice ?? 0) - (s.primary?.price ?? 0)) * s.passengerCount) +
    (s.secondary
      ? Math.max(0, (s.secondary.averagePrice - s.secondary.price) * s.passengerCount)
      : 0);
  return { flightTotal, addonsTotal, seatsTotal, subtotal, taxes, total, savings };
}
