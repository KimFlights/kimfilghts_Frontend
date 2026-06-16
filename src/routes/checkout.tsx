import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useItinerary, itinerary, computeTotals } from "@/lib/itinerary";
import { ADDON_PRICES, SEAT_TIER_PRICE, type SeatTier } from "@/domains/booking/types";
import { submitBooking } from "@/services/flightMockApi";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — KimFlights" }] }),
  component: Checkout,
});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function inferTier(seatId: string | null): SeatTier | null {
  if (!seatId) return null;
  const row = parseInt(seatId);
  if (row <= 3) return "business";
  if (row <= 7) return "plus";
  return "economy";
}

function Checkout() {
  const state = useItinerary();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    card: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const totals = useMemo(() => computeTotals(state, inferTier), [state]);

  if (!state.primary) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Empty itinerary
          </p>
          <h1 className="mt-3 text-3xl font-light text-foreground">No flights selected</h1>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.25em] text-background hover:opacity-90"
          >
            Start a new search
          </Link>
        </div>
      </main>
    );
  }

  const { primary, secondary } = state;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submitBooking({
      primaryId: primary.id,
      secondaryId: secondary?.id ?? null,
      passengers: state.passengers,
      addons: state.addons,
      seats: {
        primary: state.selectedSeats.primary,
        connecting: secondary ? state.selectedSeats.connecting : [],
      },
      total: totals.total,
      contact: { email: contact.email, phone: contact.phone },
    });
    itinerary.confirm();
    navigate({ to: "/booking-confirmation" });
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="animate-fade-up">
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-4xl font-light tracking-tight text-foreground md:text-5xl">
            Checkout
          </h1>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
          <form
            onSubmit={handlePay}
            className="animate-fade-up space-y-12"
            style={{ animationDelay: "0.1s" }}
          >
            <FormSection title="Contact" step="01">
              <Input
                label="Email"
                type="email"
                required
                value={contact.email}
                onChange={(v) => setContact({ ...contact, email: v })}
                placeholder="you@example.com"
              />
              <Input
                label="Phone"
                type="tel"
                required
                value={contact.phone}
                onChange={(v) => setContact({ ...contact, phone: v })}
                placeholder="+1 555 000 0000"
              />
            </FormSection>

            <FormSection title="Payment" step="02">
              <Input
                label="Card number"
                required
                value={contact.card}
                onChange={(v) => setContact({ ...contact, card: v })}
                placeholder="1234 5678 9012 3456"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry"
                  required
                  value={contact.expiry}
                  onChange={(v) => setContact({ ...contact, expiry: v })}
                  placeholder="MM / YY"
                />
                <Input
                  label="CVC"
                  required
                  value={contact.cvc}
                  onChange={(v) => setContact({ ...contact, cvc: v })}
                  placeholder="123"
                />
              </div>
              <Input
                label="Cardholder name"
                required
                value={contact.name}
                onChange={(v) => setContact({ ...contact, name: v })}
                placeholder="Name on card"
              />
            </FormSection>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-foreground py-5 text-xs font-semibold uppercase tracking-[0.3em] text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Processing…" : `Confirm & pay $${totals.total.toLocaleString()}`}
            </button>
          </form>

          <aside
            className="animate-fade-up lg:sticky lg:top-28 lg:self-start"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Order summary
              </p>
              <h2 className="mt-1 text-2xl font-light text-foreground">Your itinerary</h2>

              <div className="mt-6 space-y-4 border-t border-border pt-4">
                <SummaryLine
                  label={
                    secondary
                      ? `${primary.originCode} → ${secondary.cityCode}`
                      : `${primary.originCode} → ${primary.destinationCode}`
                  }
                  detail={`${formatTime(primary.departTime)} · ${primary.airline}`}
                  value={`$${(primary.price * state.passengerCount).toLocaleString()}`}
                  sub={`${state.passengerCount} × $${primary.price}`}
                />
                {secondary && (
                  <SummaryLine
                    label={`${secondary.cityCode} → ${primary.destinationCode}`}
                    detail={`Connection · ${secondary.city}`}
                    value={`$${(secondary.price * state.passengerCount).toLocaleString()}`}
                    sub={`${state.passengerCount} × $${secondary.price}`}
                  />
                )}
              </div>

              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Passengers & seats
                </p>
                {state.passengers.map((p, i) => {
                  const a = state.addons[i];
                  const primarySeat = state.selectedSeats.primary[i];
                  const connectingSeat = secondary ? state.selectedSeats.connecting[i] : null;
                  const seatCharge =
                    (inferTier(primarySeat) ? SEAT_TIER_PRICE[inferTier(primarySeat)!] : 0) +
                    (inferTier(connectingSeat) ? SEAT_TIER_PRICE[inferTier(connectingSeat)!] : 0);
                  return (
                    <div key={p.id} className="text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span className="text-foreground">
                          {p.firstName || `Passenger ${i + 1}`} {p.lastName}
                        </span>
                        <span>
                          $
                          {(
                            (a.checkedBag ? ADDON_PRICES.checkedBag : 0) +
                            (a.priority ? ADDON_PRICES.priority : 0) +
                            seatCharge
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[10px]">
                        <span>
                          {secondary
                            ? `${primary.originCode}→${secondary.cityCode}`
                            : `${primary.originCode}→${primary.destinationCode}`}
                        </span>
                        <span>Seat {primarySeat ?? "—"}</span>
                      </div>
                      {secondary && (
                        <div className="flex justify-between font-mono text-[10px]">
                          <span>
                            {secondary.cityCode}→{primary.destinationCode}
                          </span>
                          <span>Seat {connectingSeat ?? "—"}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                <Line label="Flights" value={`$${totals.flightTotal.toLocaleString()}`} />
                <Line label="Add-ons" value={`$${totals.addonsTotal.toLocaleString()}`} />
                <Line label="Seat upgrades" value={`$${totals.seatsTotal.toLocaleString()}`} />
                <Line label="Taxes & fees" value={`$${totals.taxes.toLocaleString()}`} />
                {totals.savings > 0 && (
                  <Line
                    label="Deal savings"
                    value={`−$${totals.savings.toLocaleString()}`}
                    accent
                  />
                )}
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Total
                </span>
                <span className="text-3xl font-light text-foreground">
                  ${totals.total.toLocaleString()}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FormSection({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-baseline gap-4 border-b border-border pb-3">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{step}</span>
        <h2 className="text-xl font-medium text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  ...props
}: { label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
>) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-border bg-transparent py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-foreground"
      />
    </label>
  );
}

function SummaryLine({
  label,
  detail,
  value,
  sub,
}: {
  label: string;
  detail: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{sub}</p>
      </div>
      <p className="text-base font-light text-foreground">{value}</p>
    </div>
  );
}

function Line({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-deal" : "text-foreground"}>{value}</span>
    </div>
  );
}
