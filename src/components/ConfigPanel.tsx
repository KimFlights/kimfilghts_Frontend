import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { fetchOccupiedSeats, type Flight, type SecondaryUpsell } from "@/services/flightMockApi";
import { itinerary, useItinerary, computeTotals } from "@/lib/itinerary";
import {
  ADDON_PRICES,
  SEAT_TIER_PRICE,
  type SeatTier,
  type SegmentKey,
} from "@/domains/booking/types";
import { SeatMap, generateSeats } from "@/components/SeatMap";

import { Check, Briefcase, Luggage, Zap, X } from "lucide-react";

interface Props {
  primary: Flight;
  secondary: SecondaryUpsell | null;
  onClose: () => void;
}

const STEPS = ["Passengers", "Add-ons", "Seats"] as const;

export function ConfigPanel({ primary, secondary, onClose }: Props) {
  const state = useItinerary();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [currentSeat, setCurrentSeat] = useState(0);
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("primary");
  const [occupiedPrimarySeats, setOccupiedPrimarySeats] = useState<Set<string>>(new Set());

  // Independent seat maps per segment.
  const primarySeats = useMemo(() => generateSeats(primary.seatCapacity), [primary.seatCapacity]);
  const connectingSeats = useMemo(() => generateSeats(), []);
  const seatsBySegment: Record<SegmentKey, ReturnType<typeof generateSeats>> = {
    primary: primarySeats,
    connecting: connectingSeats,
  };
  const occupiedSeatsBySegment: Record<SegmentKey, Set<string>> = {
    primary: occupiedPrimarySeats,
    connecting: new Set(),
  };
  const capacityBySegment: Record<SegmentKey, number> = {
    primary: primary.seatCapacity,
    connecting: 114,
  };

  const seatTierOf = (id: string | null): SeatTier | null => {
    if (!id) return null;
    // Search both maps — seat ids ("12A") may overlap between segments.
    const hit = primarySeats.find((s) => s.id === id) ?? connectingSeats.find((s) => s.id === id);
    return hit?.tier ?? null;
  };
  const totals = computeTotals(state, seatTierOf);

  const passengersValid = state.passengers.every(
    (p) => p.firstName.trim() && p.lastName.trim() && p.dob,
  );
  const primarySeatsValid = state.selectedSeats.primary.every((s) => s !== null);
  const connectingSeatsValid =
    !secondary || state.selectedSeats.connecting.every((s) => s !== null);
  const seatsValid = primarySeatsValid && connectingSeatsValid;
  const canNext = step === 0 ? passengersValid : step === 1 ? true : seatsValid;

  // Reset passenger focus whenever the user switches segment tabs.
  useEffect(() => {
    setCurrentSeat(0);
  }, [activeSegment]);

  useEffect(() => {
    let cancelled = false;
    setOccupiedPrimarySeats(new Set());

    fetchOccupiedSeats(primary.id)
      .then((seats) => {
        if (!cancelled) setOccupiedPrimarySeats(seats);
      })
      .catch(() => {
        if (!cancelled) setOccupiedPrimarySeats(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [primary.id]);

  const handleSeatSelect = (seatId: string) => {
    const current = state.selectedSeats[activeSegment];
    if (current[currentSeat] === seatId) {
      itinerary.setSeat(activeSegment, currentSeat, null);
      return;
    }
    itinerary.setSeat(activeSegment, currentSeat, seatId);
    const next = current.findIndex((s, i) => i !== currentSeat && !s);
    if (next >= 0) setCurrentSeat(next);
  };

  const handleContinue = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      onClose();
      navigate({ to: "/checkout" });
    }
  };

  const renderSeatMap = (segment: SegmentKey) => (
    <SeatMap
      capacity={capacityBySegment[segment]}
      occupiedSeats={occupiedSeatsBySegment[segment]}
      selected={state.selectedSeats[segment]}
      currentPassenger={currentSeat}
      onSelect={handleSeatSelect}
      onPassengerChange={setCurrentSeat}
      passengerCount={state.passengerCount}
      passengerNames={state.passengers.map((p) => p.firstName || `P`)}
    />
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-card">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Configure
            </p>
            <h2 className="mt-1 text-2xl font-light text-foreground">
              {primary.originCode} → {primary.destinationCode}
            </h2>
            <div className="mt-3 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] ${i === step ? "text-foreground" : i < step ? "text-foreground/60" : "text-muted-foreground"}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] ${i <= step ? "border-foreground" : "border-border"}`}
                  >
                    {i + 1}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-6">
              {state.passengers.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-border p-5">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Passenger {i + 1} · {p.type}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="First name"
                      value={p.firstName}
                      onChange={(v) => itinerary.updatePassenger(i, { firstName: v })}
                    />
                    <Field
                      label="Last name"
                      value={p.lastName}
                      onChange={(v) => itinerary.updatePassenger(i, { lastName: v })}
                    />
                    <Field
                      label="Date of birth"
                      type="date"
                      value={p.dob}
                      onChange={(v) => itinerary.updatePassenger(i, { dob: v })}
                    />
                    <SelectField
                      label="Type"
                      value={p.type}
                      onChange={(v) =>
                        itinerary.updatePassenger(i, { type: v as "adult" | "child" })
                      }
                      options={["adult", "child"]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {state.passengers.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-border p-5">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {p.firstName || `Passenger ${i + 1}`} · Add-ons
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <AddonCard
                      icon={<Briefcase className="h-4 w-4" />}
                      title="Carry-on"
                      price={ADDON_PRICES.carryOn}
                      active={state.addons[i].carryOn}
                      onToggle={() =>
                        itinerary.updateAddon(i, { carryOn: !state.addons[i].carryOn })
                      }
                    />
                    <AddonCard
                      icon={<Luggage className="h-4 w-4" />}
                      title="Checked 50lbs"
                      price={ADDON_PRICES.checkedBag}
                      active={state.addons[i].checkedBag}
                      onToggle={() =>
                        itinerary.updateAddon(i, { checkedBag: !state.addons[i].checkedBag })
                      }
                    />
                    <AddonCard
                      icon={<Zap className="h-4 w-4" />}
                      title="Priority Boarding"
                      price={ADDON_PRICES.priority}
                      active={state.addons[i].priority}
                      onToggle={() =>
                        itinerary.updateAddon(i, { priority: !state.addons[i].priority })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MVP: connecting flights disabled — single SeatMap for primary only. */}
          {step === 2 && renderSeatMap("primary")}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Live total
              </p>
              <p className="text-xs text-muted-foreground">
                {state.passengerCount} guest{state.passengerCount !== 1 && "s"} · Step {step + 1} of{" "}
                {STEPS.length}
              </p>
            </div>
            <span className="text-3xl font-light text-foreground">
              ${totals.total.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-full border border-border px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground hover:bg-accent"
              >
                Back
              </button>
            )}
            <button
              disabled={!canNext}
              onClick={handleContinue}
              className="flex-1 rounded-full bg-foreground py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-background transition hover:opacity-90 disabled:opacity-30"
            >
              {step === STEPS.length - 1 ? "Proceed to checkout" : "Continue"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-foreground [color-scheme:dark]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground outline-none focus:border-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background capitalize">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddonCard({
  icon,
  title,
  price,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  price: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition ${active ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="rounded-full border border-border p-2">{icon}</div>
        {active && <Check className="h-4 w-4 text-foreground" />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {price === 0 ? "Included" : `+$${price}`}
      </p>
    </button>
  );
}
