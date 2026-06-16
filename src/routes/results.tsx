import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import {
  fetchFlights,
  fetchSecondaryConnections,
  type Flight,
  type SecondaryUpsell,
} from "@/services/flightMockApi";
import { itinerary } from "@/lib/itinerary";
import { ConfigPanel } from "@/components/ConfigPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const searchSchema = z.object({
  origin: z.string().default("JFK"),
  destination: z.string().default("CDG"),
  date: z.string().default(new Date().toISOString().slice(0, 10)),
  passengers: z.coerce.number().int().min(1).max(9).default(1),
  adults: z.coerce.number().int().min(1).max(6).default(1),
  children: z.coerce.number().int().min(0).max(4).default(0),
});

export const Route = createFileRoute("/results")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Flight Results — KimFlights" }] }),
  component: Results,
});

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDuration = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

function Results() {
  const search = Route.useSearch();
  const [flights, setFlights] = useState<Flight[] | null>(null);
  const [selected, setSelected] = useState<Flight | null>(null);
  const [upsell, setUpsell] = useState<SecondaryUpsell | null>(null);
  const [showUpsell, setShowUpsell] = useState<SecondaryUpsell[] | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    setFlights(null);
    fetchFlights(search).then(setFlights);
  }, [search.origin, search.destination, search.date, search.passengers]);

  const handleSelect = async (f: Flight) => {
    setSelected(f);
    setUpsell(null);
    itinerary.setPrimary(f, search.passengers);
    const list = await fetchSecondaryConnections(search.destination);
    setShowUpsell(list);
  };

  const skipUpsell = () => {
    setUpsell(null);
    itinerary.setSecondary(null);
    setShowUpsell(null);
    setConfigOpen(true);
  };

  const pickUpsell = (u: SecondaryUpsell | null) => {
    setUpsell(u);
    itinerary.setSecondary(u);
    setShowUpsell(null);
    setConfigOpen(true);
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-6xl px-6 md:px-12">
        <div className="animate-fade-up flex flex-col gap-2">
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← New search
          </Link>
          <h1 className="text-4xl font-light tracking-tight text-foreground md:text-5xl">
            {search.origin} <span className="text-muted-foreground">→</span> {search.destination}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(search.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · {search.passengers} guest{search.passengers > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {flights === null &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          {flights?.map((f, i) => (
            <FlightRow
              key={f.id}
              flight={f}
              index={i}
              isSelected={selected?.id === f.id}
              onSelect={() => handleSelect(f)}
            />
          ))}
        </div>
      </section>

      {showUpsell && selected && (
        <UpsellSheet
          primary={selected}
          upsells={showUpsell}
          onSkip={skipUpsell}
          onPick={pickUpsell}
          onClose={() => {
            setShowUpsell(null);
            setSelected(null);
          }}
        />
      )}

      {configOpen && selected && (
        <ConfigPanel
          primary={selected}
          secondary={upsell}
          onClose={() => {
            setConfigOpen(false);
            setSelected(null);
            setUpsell(null);
            itinerary.clearSegmentSeats("primary");
            itinerary.clearSegmentSeats("connecting");
          }}
        />
      )}
    </main>
  );
}

function FlightRow({
  flight,
  index,
  isSelected,
  onSelect,
}: {
  flight: Flight;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`group animate-fade-up rounded-xl border bg-card p-6 transition-all duration-500 ${
        flight.isDeal ? "deal-glow border-transparent" : "border-border hover:border-foreground/30"
      } ${isSelected ? "ring-2 ring-foreground" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 flex items-center gap-3 md:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {flight.airline}
          </div>
          <div className="text-[10px] text-muted-foreground">{flight.flightNumber}</div>
        </div>
        <div className="col-span-12 flex items-center gap-6 md:col-span-6">
          <div>
            <div className="text-2xl font-light text-foreground">
              {formatTime(flight.departTime)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {flight.originCode}
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {formatDuration(flight.durationMinutes)}
            </div>
            <div className="relative my-2 h-px w-full bg-border">
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-foreground" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light text-foreground">
              {formatTime(flight.arriveTime)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {flight.destinationCode}
            </div>
          </div>
        </div>
        <div className="col-span-12 flex items-center justify-between gap-4 md:col-span-4 md:justify-end">
          <div className="flex flex-col items-end">
            {flight.isDeal && (
              <span className="mb-1 rounded-full bg-deal/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-deal">
                {flight.dealLabel}
              </span>
            )}
            <div className="flex items-baseline gap-2">
              {flight.isDeal && (
                <span className="text-xs text-muted-foreground line-through">
                  ${flight.averagePrice}
                </span>
              )}
              <span className="text-3xl font-light text-foreground">${flight.price}</span>
            </div>
          </div>
          <button
            onClick={onSelect}
            className="rounded-full bg-foreground px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-background transition hover:opacity-90"
          >
            Select
          </button>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen} className="mt-4">
        <CollapsibleTrigger className="group/trigger flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground">
          Flight Details
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            <DetailCell label="Aircraft" value={flight.aircraft.model} />
            <DetailCell label="Legroom" value={`${flight.aircraft.legroomInches} inches`} />
            <DetailCell label="Baggage" value={flight.aircraft.baggage} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-4">
      <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-light text-foreground">{value}</p>
    </div>
  );
}

function UpsellSheet({
  primary,
  upsells,
  onSkip,
  onPick,
  onClose,
}: {
  primary: Flight;
  upsells: SecondaryUpsell[];
  onSkip: () => void;
  onPick: (u: SecondaryUpsell) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <aside className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card">
        <div className="border-b border-border p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Optional</p>
          <h2 className="mt-1 text-2xl font-light text-foreground">Add a second city?</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Travelers to {primary.destination} often add a nearby city for less.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {upsells.map((u) => (
            <button
              key={u.id}
              onClick={() => onPick(u)}
              className="group block w-full overflow-hidden rounded-xl border border-border text-left transition hover:border-foreground/40"
            >
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={u.imageUrl}
                  alt={u.city}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="flex items-end justify-between p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {u.country}
                  </p>
                  <p className="text-lg font-medium text-foreground">{u.city}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{u.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    From
                  </p>
                  <p className="text-xl font-light text-foreground">+${u.price}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-6">
          <button
            onClick={onSkip}
            className="w-full rounded-full border border-border py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground hover:bg-accent"
          >
            Skip — continue with primary
          </button>
        </div>
      </aside>
    </>
  );
}
