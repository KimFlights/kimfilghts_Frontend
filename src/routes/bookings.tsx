import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchUserBookings, type UserBooking } from "@/services/flightMockApi";
import { getAuthSnapshot } from "@/lib/auth";
import { QrCode, Plane, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — KimFlights" }] }),
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = getAuthSnapshot();
    if (!isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: Bookings,
});

function Bookings() {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 pt-32 pb-24 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-baseline justify-between border-b border-border pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Account</p>
            <h1 className="mt-1 text-3xl font-light tracking-tight text-foreground">My Bookings</h1>
          </div>
        </div>

        {loading ? (
          <div className="mt-16 text-center text-sm uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Loading…
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-16 text-center">
            <Plane className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">No bookings yet</p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.bookingReference}
                booking={b}
                expanded={expandedRef === b.bookingReference}
                onToggle={() =>
                  setExpandedRef(
                    expandedRef === b.bookingReference ? null : b.bookingReference,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BookingCard({
  booking,
  expanded,
  onToggle,
}: {
  booking: UserBooking;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { bookingReference, totalPrice, passengers } = booking;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all">
      {/* Row summary — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Reference</p>
            <p className="mt-0.5 font-mono text-base text-foreground">{bookingReference}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Passengers</p>
            <p className="mt-0.5 text-sm text-foreground">{passengers?.length ?? 0}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Total</p>
            <p className="mt-0.5 text-sm text-deal font-medium">${totalPrice?.toLocaleString()}</p>
          </div>
        </div>
        <span className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expanded detail — boarding pass style */}
      {expanded && (
        <div className="border-t border-border animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
            {/* Left: passengers & seats */}
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Passengers & Seats
                </p>
                <div className="space-y-3">
                  {passengers?.map((p, i) => {
                    const seat = p.tickets?.[0]?.seatNum;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                              Passenger
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Seat</p>
                          <p
                            className={`font-mono text-lg font-light ${seat && seat !== "UNASSIGNED" ? "text-deal" : "text-muted-foreground/50"}`}
                          >
                            {seat && seat !== "UNASSIGNED" ? seat : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background/50 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reference</p>
                  <p className="mt-1 font-mono text-sm text-foreground">{bookingReference}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total Paid</p>
                  <p className="mt-1 text-sm text-deal font-medium">${totalPrice?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center border-t border-border md:border-l md:border-t-0 bg-background/40 p-8 min-w-[200px]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Boarding Pass
              </p>
              <div className="mt-4 rounded-2xl border border-foreground/20 bg-background p-5">
                <QrCode className="h-28 w-28 text-foreground" strokeWidth={1} />
              </div>
              <p className="mt-3 font-mono text-xs text-muted-foreground text-center">
                {bookingReference}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Scan at gate
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
