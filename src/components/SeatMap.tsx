import { useMemo } from "react";
import type { Seat, SeatTier } from "@/domains/booking/types";
import { SEAT_TIER_PRICE } from "@/domains/booking/types";

const DEFAULT_CAPACITY = 114;

export function generateSeats(
  capacity = DEFAULT_CAPACITY,
  occupiedSeats: Set<string> = new Set(),
): Seat[] {
  const seats: Seat[] = [];
  const normalizedCapacity = Math.max(0, Math.floor(capacity));

  const addRows = (startRow: number, maxRows: number, cols: string[], tier: SeatTier) => {
    let row = startRow;
    let rowsAdded = 0;
    while (seats.length < normalizedCapacity && rowsAdded < maxRows) {
      for (const col of cols) {
        if (seats.length >= normalizedCapacity) break;
        const id = `${row}${col}`;
        seats.push({ id, row, col, tier, occupied: occupiedSeats.has(id) });
      }
      row += 1;
      rowsAdded += 1;
    }
    return row;
  };

  const businessCols = ["A", "B", "E", "F"];
  const econCols = ["A", "B", "C", "D", "E", "F"];
  let nextRow = addRows(1, 3, businessCols, "business");
  nextRow = addRows(nextRow, 4, econCols, "plus");
  addRows(nextRow, Number.POSITIVE_INFINITY, econCols, "economy");

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
  capacity: number;
  occupiedSeats: Set<string>;
  selected: (string | null)[];
  currentPassenger: number;
  onSelect: (seatId: string) => void;
  onPassengerChange?: (i: number) => void;
  passengerCount: number;
  passengerNames: string[];
}

export function SeatMap({
  capacity,
  occupiedSeats,
  selected,
  currentPassenger,
  onSelect,
  onPassengerChange,
  passengerCount,
  passengerNames,
}: Props) {
  const seats = useMemo(() => generateSeats(capacity, occupiedSeats), [capacity, occupiedSeats]);

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
