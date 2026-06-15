import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AIRPORTS, searchAirports, type Airport } from "@/domains/airports/data";

interface Props {
  label: string;
  value: string;
  onChange: (code: string, airport: Airport) => void;
}

export function AirportCombobox({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = AIRPORTS.find((a) => a.code === value);
  const results = searchAirports(query);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full flex-col gap-1 bg-background/60 px-5 py-4 text-left transition hover:bg-background/80"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </span>
          <span className="text-sm font-medium text-foreground">
            {selected ? `${selected.code} — ${selected.city}` : "Select airport"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-card border-border" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="City, region, or code…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No airports found.</CommandEmpty>
            <CommandGroup>
              {results.map((a) => (
                <CommandItem
                  key={a.code}
                  value={a.code}
                  onSelect={() => {
                    onChange(a.code, a);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{a.city}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {a.region} · {a.country}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{a.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
