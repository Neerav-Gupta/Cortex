import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AlertFeed } from "@/components/AlertFeed";
import { EditListingForm } from "@/components/EditListingForm";
import { FairnessPanel } from "@/components/FairnessPanel";
import { MarketAssessment } from "@/components/MarketAssessment";
import { NeighborhoodComparisonChart } from "@/components/NeighborhoodComparisonChart";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { PropertyOverview } from "@/components/PropertyOverview";
import { OverridePanel } from "@/components/OverridePanel";
import { PricePath } from "@/components/PricePath";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { StrategyCard } from "@/components/StrategyCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sym } from "@/components/ui/sym";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { addressUpToState } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import {
  deleteListing,
  fetchGuardrails,
  fetchListing,
  listListings,
  refreshListing,
  submitOverride,
} from "@/lib/api";
import type { OverridePayload } from "@/lib/types";

/** Lightweight click-away kebab menu (no extra dependency). */
function KebabMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-rule text-ink-2 transition-[color,background-color,border-color,transform] duration-150 ease-fb active:scale-95 hover:border-rule-strong hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Sym name="more_vert" sm />
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 z-40 mt-1 min-w-[12rem] origin-top-right overflow-hidden rounded-lg border border-rule bg-paper-3 py-1 shadow duration-150 ease-fb animate-in fade-in zoom-in-95"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  destructive,
  iconClassName,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-paper-2 disabled:opacity-50",
        destructive ? "text-redline" : "text-ink"
      )}
    >
      <Sym name={icon} sm className={iconClassName} />
      {label}
    </button>
  );
}

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: listings } = useQuery({
    queryKey: ["listings"],
    queryFn: listListings,
    refetchInterval: 60000,
  });

  // On /listings (no :id) default to the first property; otherwise use the URL.
  const listingId = id ?? listings?.[0]?.listing_id ?? "";
  const activeAddress =
    listings?.find((l) => l.listing_id === listingId)?.address ?? "";

  const {
    data: agentOutput,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => fetchListing(listingId),
    refetchInterval: 30000,
    enabled: !!listingId,
  });

  const { data: guardrails } = useQuery({
    queryKey: ["guardrails"],
    queryFn: fetchGuardrails,
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshListing(listingId),
    onSuccess: () => {
      toast({ title: "Analysis updated." });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: (payload: OverridePayload) => submitOverride(listingId, payload),
    onSuccess: () => {
      toast({ title: "Override applied." });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
    onError: () => {
      toast({ title: "Couldn't apply the override — try again.", variant: "destructive" });
    },
  });

  const handleOverrideSubmit = (payload: OverridePayload) => {
    overrideMutation.mutate(payload);
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast({ title: "Property deleted." });
      navigate("/listings");
    },
    onError: () => {
      toast({ title: "Couldn't delete the property — try again.", variant: "destructive" });
    },
  });

  // No properties at all — guide the user to Search.
  if (listings && listings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Sym name="home_work" lg className="text-ink-3" />
          <p className="text-sm text-ink-2">
            No properties to profile yet. Search for an address to get a pricing read.
          </p>
          <Button variant="outline" onClick={() => navigate("/search")}>
            <Sym name="search" sm />
            Search a property
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Strategy profile</h1>
          <p className="mt-1 text-ink-2">
            Pricing scenarios, fairness checks, and AI guidance for this property.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Three-dot menu: re-run analysis + delete. */}
          <KebabMenu>
            <MenuItem
              icon="restart_alt"
              label="Re-run analysis"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              iconClassName={refreshMutation.isPending ? "animate-spin" : ""}
            />
            <MenuItem
              icon="delete"
              label="Delete property"
              destructive
              onClick={() => {
                if (confirm("Delete this property? This cannot be undone.")) {
                  deleteMutation.mutate();
                }
              }}
            />
          </KebabMenu>

          {/* Switch which property's strategy profile is shown. */}
          {listings && listings.length > 0 && (
            <Select
              value={listingId}
              onValueChange={(value) => navigate(`/listing/${value}`)}
            >
              <SelectTrigger className="w-[260px]">
                <Sym name="swap_horiz" sm className="mr-2 flex-none text-ink-2" />
                <span className="truncate">
                  {activeAddress ? addressUpToState(activeAddress) : "Switch property"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.listing_id} value={l.listing_id}>
                    {l.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load this property</AlertTitle>
          <AlertDescription>
            Something went wrong fetching the strategy profile. Try re-running the
            analysis.
          </AlertDescription>
        </Alert>
      )}

      {isLoading || !agentOutput ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Sym name="home_work" sm />
              General info
            </TabsTrigger>
            <TabsTrigger value="strategy">
              <Sym name="show_chart" sm />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Sym name="tune" sm />
              Edit listing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <PropertyOverview
              listing={agentOutput.listing}
              lastUpdated={agentOutput.last_updated}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <PriceHistoryChart priceCutHistory={agentOutput.listing.price_cut_history} />
              <NeighborhoodComparisonChart
                currentPrice={agentOutput.listing.current_price}
                originalPrice={agentOutput.listing.original_price}
                neighborhoodMedian={agentOutput.listing.neighborhood_median}
              />
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <StrategyCard
              recommendation={agentOutput.recommendation}
              scenario={
                agentOutput.scenarios.find(
                  (s) => s.id === agentOutput.recommendation.recommended_scenario_id
                ) ?? agentOutput.scenarios[0]
              }
            />
            <MarketAssessment assessment={agentOutput.assessment} />
            <ScenarioComparison
              scenarios={agentOutput.scenarios}
              recommendedId={agentOutput.recommendation.recommended_scenario_id}
            />
            <PricePath
              scenarios={agentOutput.scenarios}
              neighborhoodMedian={agentOutput.listing.neighborhood_median}
            />
            {!guardrails ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <FairnessPanel scenarios={agentOutput.scenarios} guardrails={guardrails} />
            )}
            <AlertFeed
              alerts={agentOutput.recommendation.alerts}
              lastUpdated={agentOutput.last_updated}
            />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <EditListingForm listingId={listingId} listing={agentOutput.listing} />
            {guardrails && (
              <OverridePanel
                listingId={listingId}
                listing={agentOutput.listing}
                scenarios={agentOutput.scenarios}
                onOverrideSubmit={handleOverrideSubmit}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
