import { useMemo } from "react";
import type { Seat, SeatTier } from "@/domains/booking/types";
import { SEAT_TIER_PRICE } from "@/domains/booking/types";

export function generateSeats(): Seat[] {
  const seats: Seat[] = [];
  // Business: rows 1-3, 2x2 layout (A, B __ E, F)
  const businessCols = ["A", "B", "E", "F"];
  for (let row = 1; row <= 3; row++) {
    for (const col of businessCols) {
      seats.push({ id: `${row}${col}`, row, col, tier: "business", occupied: Math.random() < 0.4 });
    }
  }
  // Economy Plus: rows 4-7, 3x3 (A B C __ D E F)
  const econCols = ["A", "B", "C", "D", "E", "F"];
  for (let row = 4; row <= 7; row++) {
    for (const col of econCols) {
      seats.push({ id: `${row}${col}`, row, col, tier: "plus", occupied: Math.random() < 0.35 });
    }
  }
  // Economy: rows 8-20
  for (let row = 8; row <= 20; row++) {
    for (const col of econCols) {
      seats.push({ id: `${row}${col}`, row, col, tier: "economy", occupied: Math.random() < 0.5 });
    }
  }
  return seats;
}

const TIER_BORDER: Record<SeatTier, string> = {
  business: "border-deal/70",
  plus: "border-foreground/40",
  economy: "border-border",
};

const TIER_LABEL: Record<SeatTier, string> = {
  business: "Business",
  plus: "Economy Plus",
  economy: "Economy",
};

interface Props {
  seats: Seat[];
  selected: (string | null)[];
  currentPassenger: number;
  onSelect: (seatId: string) => void;
  onPassengerChange?: (i: number) => void;
  passengerCount: number;
  passengerNames: string[];
}

export function SeatMap({
  seats,
  selected,
  currentPassenger,
  onSelect,
  onPassengerChange,
  passengerCount,
  passengerNames,
}: Props) {
  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    seats.forEach((s) => {
      if (!map.has(s.row)) map.set(s.row, []);
      map.get(s.row)!.push(s);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  const selectedSet = new Set(selected.filter(Boolean) as string[]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Passenger picker */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: passengerCount }).map((_, i) => {
          const isCurrent = i === currentPassenger;
          const seat = selected[i];
          return (
            <button
              type="button"
              key={i}
              onClick={() => onPassengerChange?.(i)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${
                isCurrent
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
              }`}
            >
              <span>{passengerNames[i] || `P${i + 1}`}</span>
              <span className="font-mono">{seat ?? "—"}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {(["business", "plus", "economy"] as SeatTier[]).map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded border ${TIER_BORDER[t]} bg-background`} />
            <span>
              {TIER_LABEL[t]} {SEAT_TIER_PRICE[t] > 0 ? `+$${SEAT_TIER_PRICE[t]}` : "—"}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-border bg-muted/60" />
          <span>Occupied</span>
        </div>
      </div>

      {/* Fuselage */}
      <div className="w-full max-w-md rounded-[3rem] border border-border bg-card/50 p-6">
        <div className="mb-6 h-6 rounded-t-[3rem] border-b border-border" />
        <div className="flex flex-col gap-1.5">
          {rows.map(([row, rowSeats]) => {
            // determine aisle gap position
            const isBusiness = rowSeats[0].tier === "business";
            const left = isBusiness ? rowSeats.slice(0, 2) : rowSeats.slice(0, 3);
            const right = isBusiness ? rowSeats.slice(2) : rowSeats.slice(3);
            return (
              <div key={row} className="flex items-center gap-2">
                <span className="w-5 text-right text-[9px] text-muted-foreground">{row}</span>
                <div className="flex flex-1 items-center justify-center gap-1.5">
                  {left.map((s) => (
                    <SeatBtn
                      key={s.id}
                      seat={s}
                      selected={selectedSet.has(s.id)}
                      isMine={selected[currentPassenger] === s.id}
                      onSelect={onSelect}
                    />
                  ))}
                  <span className="mx-2 w-3" />
                  {right.map((s) => (
                    <SeatBtn
                      key={s.id}
                      seat={s}
                      selected={selectedSet.has(s.id)}
                      isMine={selected[currentPassenger] === s.id}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SeatBtn({
  seat,
  selected,
  isMine,
  onSelect,
}: {
  seat: Seat;
  selected: boolean;
  isMine: boolean;
  onSelect: (id: string) => void;
}) {
  const disabled = seat.occupied || (selected && !isMine);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(seat.id)}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-[9px] font-mono transition ${
        seat.occupied
          ? "border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
          : isMine
            ? "border-foreground bg-foreground text-background"
            : selected
              ? "border-foreground/70 bg-foreground/30 text-foreground cursor-not-allowed"
              : `${TIER_BORDER[seat.tier]} bg-background text-foreground hover:bg-foreground/10`
      }`}
      title={`${seat.id} · ${seat.tier}`}
    >
      {seat.col}
    </button>
  );
}
