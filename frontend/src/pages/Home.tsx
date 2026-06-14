import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sym } from "@/components/ui/sym";
import { StrategyChip } from "@/components/StrategyChip";
import { deleteListing, listListings } from "@/lib/api";

function formatPrice(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: listListings,
    refetchInterval: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">My properties</h1>
          <p className="mt-1 text-ink-2">
            Every address you've analyzed, with its current pricing read.
          </p>
        </div>
        <Button onClick={() => navigate("/search")}>
          <Sym name="add" sm />
          Add property
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-[var(--r-lg)]" />
          ))}
        </div>
      ) : !listings || listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sym name="home_work" lg className="text-ink-3" />
            <p className="text-sm text-ink-2">
              No properties yet. Search for an address to get a pricing read.
            </p>
            <Button variant="outline" onClick={() => navigate("/search")}>
              <Sym name="search" sm />
              Search a property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const belowMedian = listing.current_price <= listing.neighborhood_median;
            return (
              <Card
                key={listing.listing_id}
                className="group relative cursor-pointer p-5 transition-[border-color,background-color] duration-200 ease-fb hover:border-rule-strong"
                onClick={() => navigate(`/listing/${listing.listing_id}`)}
              >
                <button
                  aria-label="Delete property"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded text-ink-3 opacity-0 transition-opacity hover:text-redline focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this property?")) {
                      deleteMutation.mutate(listing.listing_id);
                    }
                  }}
                >
                  <Sym name="delete" className="text-[18px]" />
                </button>

                <div className="pr-6">
                  <StrategyChip id={listing.recommended_scenario_id} />
                </div>

                <CardTitle className="mt-2 flex items-start gap-2 pr-6 text-[1.0625rem] font-semibold leading-snug">
                  <Sym name="location_on" className="mt-0.5 text-[18px] text-ink-2" />
                  <span className="line-clamp-2">{listing.address}</span>
                </CardTitle>
                <p
                  className={`text-xs ${
                    listing.days_on_market > 90 ? "text-warn" : "text-ink-2"
                  }`}
                >
                  {listing.days_on_market} days on market
                </p>

                <p
                  className={`fb-data mt-2 text-2xl font-bold ${
                    belowMedian ? "text-ok" : "text-warn"
                  }`}
                >
                  {formatPrice(listing.current_price)}
                </p>
                <p className="text-xs text-ink-2">
                  {belowMedian ? "at or below" : "above"} the {formatPrice(listing.neighborhood_median)}{" "}
                  neighborhood median
                </p>

                <div className="my-3 border-t border-rule" />

                <p className="line-clamp-2 text-sm text-ink-2">{listing.one_line_summary}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
