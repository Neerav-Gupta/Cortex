import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AdvisorChat } from "@/components/AdvisorChat";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  deleteListing,
  fetchGuardrails,
  fetchListing,
  refreshListing,
  submitOverride,
} from "@/lib/api";
import type { OverridePayload } from "@/lib/types";

export function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const listingId = id ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: (payload: OverridePayload) => submitOverride(listingId, payload),
    onSuccess: () => {
      toast({ title: "Override saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
    onError: () => {
      toast({ title: "Failed to save override.", variant: "destructive" });
    },
  });

  const handleOverrideSubmit = (payload: OverridePayload) => {
    overrideMutation.mutate(payload);
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast({ title: "Listing deleted." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to delete listing.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {agentOutput?.listing.address ?? "Loading listing..."}
          </h1>
          <p className="text-xs text-muted-foreground">
            {agentOutput
              ? `Last updated: ${new Date(agentOutput.last_updated).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this listing? This cannot be undone.")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load listing</AlertTitle>
          <AlertDescription>
            Something went wrong while fetching the dashboard data. Please try
            refreshing.
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
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="strategy">Strategy &amp; Advisor</TabsTrigger>
            <TabsTrigger value="edit">Edit Listing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <PropertyOverview listing={agentOutput.listing} />
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
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-6">
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
              </div>
              <div className="space-y-6">
                <AdvisorChat listingId={listingId} />
              </div>
            </div>
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
