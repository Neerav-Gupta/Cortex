import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GoogleMap } from "@/components/GoogleMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Sym } from "@/components/ui/sym";
import { createListing, suggestAddresses } from "@/lib/api";
import type { AddressSuggestion } from "@/lib/types";

export function Search() {
  const [address, setAddress] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [daysOnMarket, setDaysOnMarket] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [marker, setMarker] = useState<{ lat: number; lon: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      createListing({
        address: address.trim(),
        current_price: Number(currentPrice),
        original_price: originalPrice ? Number(originalPrice) : undefined,
        days_on_market: daysOnMarket ? Number(daysOnMarket) : undefined,
      }),
    onSuccess: (output) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      navigate(`/listing/${output.listing.listing_id}`);
    },
  });

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await suggestAddresses(value.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.display_name);
    setMarker({ lat: suggestion.lat, lon: suggestion.lon });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !currentPrice) return;
    createMutation.mutate();
  };

  const canSubmit = address.trim().length > 0 && Number(currentPrice) > 0;

  return (
    <div className="grid h-[calc(100vh-3.5rem-3rem)] min-h-[34rem] grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* Map — fills the field; the survey point drops as you pick an address. */}
      <GoogleMap
        lat={marker?.lat ?? null}
        lon={marker?.lon ?? null}
        label={marker ? address : undefined}
        className="h-64 min-h-0 lg:h-full"
      />

      {/* Search panel — the "blank side": address, price inputs, analyze. */}
      <aside className="flex min-h-0 flex-col overflow-y-auto rounded-[var(--r-lg)] border border-rule bg-paper-2 p-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Search a property</h1>
        <p className="mt-1 text-ink-2">
          Enter an address and asking price to pull live census market data and use Cortex generate a pricing
          strategy.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="relative">
            <Sym
              name="search"
              sm
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <Input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              placeholder="Address, neighborhood, city, ZIP"
              className="pl-10 text-left"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-rule bg-paper-3 text-left shadow">
                {suggestions.map((s) => (
                  <li key={`${s.lat}-${s.lon}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-paper-2"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <Sym name="location_on" className="mt-0.5 text-[18px] text-redline" />
                      <span className="line-clamp-2">{s.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Input
            type="number"
            min={1}
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="Asking price *"
            className="fb-data"
            required
          />
          <Input
            type="number"
            min={1}
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Original price"
            className="fb-data"
          />

          <div className="space-y-2 pt-1">
            <label htmlFor="days-on-market" className="text-sm text-ink-2">
              Days on market
            </label>
            <div className="flex items-center gap-3">
              <Slider
                aria-label="Days on market"
                min={0}
                max={365}
                step={1}
                value={[Number(daysOnMarket) || 0]}
                onValueChange={(v) => setDaysOnMarket(String(v[0]))}
                className="flex-1"
              />
              <Input
                id="days-on-market"
                type="number"
                min={0}
                max={365}
                value={daysOnMarket}
                onChange={(e) => setDaysOnMarket(e.target.value)}
                placeholder="0"
                className="fb-data w-20 flex-none text-center"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || !canSubmit}>
            {createMutation.isPending ? (
              <Sym name="progress_activity" sm className="animate-spin" />
            ) : (
              <>
                <span className="-my-4 -mr-1.5 inline-flex h-14 w-9 items-center justify-center overflow-hidden">
                  <img src="/cortex-sparkle.png" alt="" className="h-14 w-14 max-w-none" />
                </span>
                Analyze listing
              </>
            )}
          </Button>
        </form>

        {createMutation.isError && (
          <p className="mt-3 text-sm text-crit">
            {(createMutation.error as Error)?.message ??
              "Couldn't analyze that address. Your listing wasn't saved — try again."}
          </p>
        )}
      </aside>
    </div>
  );
}
