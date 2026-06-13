import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MapPin, Search, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createListing, deleteListing, listListings, suggestAddresses } from "@/lib/api";
import type { AddressSuggestion } from "@/lib/types";

const SCENARIO_LABELS: Record<string, string> = {
  aggressive: "Aggressive",
  moderate: "Moderate",
  patient: "Patient",
};

function formatPrice(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function Home() {
  const [address, setAddress] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [daysOnMarket, setDaysOnMarket] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: listListings,
    refetchInterval: 60000,
  });

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
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
    <div className="space-y-10">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/40 px-6 py-12 text-center shadow-sm sm:px-12">
        <Badge variant="secondary" className="mb-4">
          AI Pricing Strategy Advisor
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Know exactly how to price your home
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Cortex blends live mortgage-rate and census data with AI-driven scenario
          planning to help homeowners and advisors price fairly and sell with
          confidence.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              placeholder="Start typing a property address..."
              className="pl-9 text-left"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover text-left shadow-lg">
                {suggestions.map((s) => (
                  <li key={`${s.lat}-${s.lon}`}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                      <span className="line-clamp-2">{s.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-left">
            <div>
              <Input
                type="number"
                min={1}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="Asking price *"
                required
              />
            </div>
            <div>
              <Input
                type="number"
                min={1}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Original price"
              />
            </div>
            <div>
              <Input
                type="number"
                min={0}
                value={daysOnMarket}
                onChange={(e) => setDaysOnMarket(e.target.value)}
                placeholder="Days on market"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || !canSubmit}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Analyze
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {createMutation.isError && (
          <p className="mt-3 text-sm text-destructive">
            {(createMutation.error as Error)?.message ??
              "Could not analyze that address. Please try again."}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Analyzed listings</h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No listings analyzed yet. Enter an address and asking price above to get
              started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const belowMedian = listing.current_price <= listing.neighborhood_median;
              return (
                <Card
                  key={listing.listing_id}
                  className="group relative cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/30"
                  onClick={() => navigate(`/listing/${listing.listing_id}`)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this listing?")) {
                        deleteMutation.mutate(listing.listing_id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-start gap-2 pr-6 text-base">
                      <MapPin className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span className="line-clamp-2">{listing.address}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">{formatPrice(listing.current_price)}</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          belowMedian ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {belowMedian ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        vs {formatPrice(listing.neighborhood_median)} median
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {listing.one_line_summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{listing.days_on_market} days on market</span>
                      <Badge variant="outline">
                        {SCENARIO_LABELS[listing.recommended_scenario_id] ?? listing.recommended_scenario_id}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
