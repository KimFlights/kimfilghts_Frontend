import { createFileRoute, Link } from "@tanstack/react-router";
import { useItinerary, itinerary } from "@/lib/itinerary";
import { QrCode, Plane } from "lucide-react";

export const Route = createFileRoute("/booking-confirmation")({
  head: () => ({ meta: [{ title: "Booking Confirmed — KimFlights" }] }),
  component: Confirmation,
});

const fmt = (iso: string) => new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function Confirmation() {
  const state = useItinerary();
  const { primary, secondary, pnr, passengers, seats } = state;

  if (!primary || !pnr) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nothing here</p>
          <h1 className="mt-3 text-3xl font-light text-foreground">No confirmed booking</h1>
          <Link to="/" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.25em] text-background">Plan a journey</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-4xl px-6 md:px-12">
        <div className="animate-fade-up text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Confirmed</p>
          <h1 className="mt-6 text-6xl font-light tracking-tight text-foreground md:text-8xl">You're flying.</h1>
          <p className="mt-6 text-sm text-muted-foreground">Booking reference</p>
          <p className="mt-2 font-mono text-4xl tracking-[0.4em] text-foreground md:text-5xl">{pnr}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="animate-fade-up rounded-2xl border border-border bg-card p-8" style={{ animationDelay: "0.1s" }}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Itinerary</p>

            <FlightLeg
              from={primary.originCode}
              to={primary.destinationCode}
              fromCity={primary.origin}
              toCity={primary.destination}
              time={fmt(primary.departTime)}
              flightNo={primary.flightNumber}
            />
            {secondary && (
              <FlightLeg
                from={primary.destinationCode}
                to={secondary.cityCode}
                fromCity={primary.destination}
                toCity={secondary.city}
                time="Connection"
                flightNo="—"
              />
            )}

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Passengers</p>
              <div className="mt-3 space-y-2">
                {passengers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.firstName} {p.lastName}</span>
                    <span className="font-mono text-xs text-muted-foreground">Seat {seats[i] ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8" style={{ animationDelay: "0.2s" }}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Mobile boarding pass</p>
            <div className="mt-4 rounded-2xl border border-foreground/20 bg-background p-6">
              <QrCode className="h-40 w-40 text-foreground" strokeWidth={1} />
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">{pnr} · {primary.flightNumber}</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-3">
          <Link to="/" onClick={() => itinerary.clear()} className="rounded-full bg-foreground px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-background hover:opacity-90">
            Plan another journey
          </Link>
        </div>
      </section>
    </main>
  );
}

function FlightLeg({ from, to, fromCity, toCity, time, flightNo }: { from: string; to: string; fromCity: string; toCity: string; time: string; flightNo: string }) {
  return (
    <div className="mt-6 flex items-center gap-6">
      <div className="flex-1">
        <p className="text-3xl font-light text-foreground">{from}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{fromCity}</p>
      </div>
      <div className="flex flex-col items-center">
        <Plane className="h-4 w-4 text-foreground/60" />
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{time}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{flightNo}</p>
      </div>
      <div className="flex-1 text-right">
        <p className="text-3xl font-light text-foreground">{to}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{toCity}</p>
      </div>
    </div>
  );
}
