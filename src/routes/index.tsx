import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import heroImg from "@/assets/hero-plane.jpg";
import { AirportCombobox } from "@/components/AirportCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KimFlights — Fly Beyond" },
      { name: "description", content: "A cinematic flight booking experience. Search, discover deals, and curate journeys." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("JFK");
  const [destination, setDestination] = useState("CDG");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const passengers = adults + children;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/results", search: { origin, destination, date, passengers, adults, children } });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={heroImg} alt="Airliner above clouds" className="h-full w-full object-cover animate-hero-zoom" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background" />
      </div>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 pt-32 pb-10 md:px-12">
        <div className="mx-auto max-w-4xl text-center animate-fade-up">
          <p className="text-xs uppercase tracking-[0.4em] text-foreground/80">A new way to fly</p>
          <h1 className="mt-6 text-5xl font-light leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-8xl">
            Beyond the<br />destination.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm text-foreground/70 md:text-base">
            Discover premium flight deals and craft multi-city journeys with cinematic precision.
          </p>
        </div>

        <form onSubmit={onSearch} className="glass-panel mt-12 w-full max-w-5xl rounded-2xl p-2 animate-fade-up md:p-3" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl md:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <AirportCombobox label="From" value={origin} onChange={(c) => setOrigin(c)} />
            <AirportCombobox label="To" value={destination} onChange={(c) => setDestination(c)} />
            <label className="flex flex-col gap-1 bg-background/60 px-5 py-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Departure</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm font-medium text-foreground outline-none [color-scheme:dark]" />
            </label>
            <PassengerPicker adults={adults} setAdults={setAdults} childrenCount={children} setChildren={setChildren} />
            <button type="submit" className="m-1 rounded-lg bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-background transition hover:opacity-90">
              Search
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PassengerPicker({ adults, setAdults, childrenCount, setChildren }: { adults: number; setAdults: (n: number) => void; childrenCount: number; setChildren: (n: number) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex flex-col gap-1 bg-background/60 px-5 py-4 text-left transition hover:bg-background/80">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Guests</span>
          <span className="text-sm font-medium text-foreground">{adults} adult{adults !== 1 && "s"}{childrenCount > 0 ? `, ${childrenCount} child${childrenCount > 1 ? "ren" : ""}` : ""}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-card border-border" align="end">
        <Stepper label="Adults" value={adults} setValue={setAdults} min={1} max={6} />
        <div className="my-3 h-px bg-border" />
        <Stepper label="Children" value={childrenCount} setValue={setChildren} min={0} max={4} />
      </PopoverContent>
    </Popover>
  );
}

function Stepper({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => setValue(value - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border disabled:opacity-30">
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-4 text-center text-sm font-medium">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => setValue(value + 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-border disabled:opacity-30">
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
