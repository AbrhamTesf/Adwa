"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

const MOCK_LOCATIONS = [
  { name: "Adwa Victory Monument", lat: 14.1667, lng: 38.9 },
  { name: "Menelik II Square", lat: 14.17, lng: 38.905 },
  { name: "Taytu Memorial", lat: 14.165, lng: 38.895 },
] as const;

export function MockLocationTrigger() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (name: string, lat: number, lng: number) => {
    // TODO: Wire to geolocation / itinerary context during hackathon
    setActive(name);
    setOpen(false);
    console.debug("[MockLocation]", { name, lat, lng });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-56 rounded-lg border border-heritage-gold/30 bg-white p-2 shadow-lg">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-heritage-earth">
            Dev: Mock Location
          </p>
          {MOCK_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleSelect(loc.name, loc.lat, loc.lng)}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-heritage-sand"
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-heritage-earth px-4 py-2 text-sm text-white shadow-md hover:bg-heritage-earth/90"
        aria-label="Toggle mock location menu"
      >
        <MapPin size={16} />
        {active ?? "Mock GPS"}
      </button>
    </div>
  );
}
