import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Sym } from "@/components/ui/sym";
import type { ListingData, OverridePayload, Scenario } from "@/lib/types";

interface OverridePanelProps {
  listingId: string;
  listing: ListingData;
  scenarios: Scenario[];
  onOverrideSubmit: (payload: OverridePayload) => void;
}

const NO_LOCK = "none";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function OverridePanel({
  listing,
  scenarios,
  onOverrideSubmit,
}: OverridePanelProps) {
  const min = Math.round(listing.neighborhood_median * 0.8);
  const max = listing.current_price;

  const [floorPrice, setFloorPrice] = useState(min);
  const [lockedScenarioId, setLockedScenarioId] = useState(NO_LOCK);
  const [advisorNote, setAdvisorNote] = useState("");
  const [justApplied, setJustApplied] = useState(false);

  const handleApply = () => {
    onOverrideSubmit({
      floor_price: floorPrice,
      locked_scenario_id: lockedScenarioId === NO_LOCK ? "" : lockedScenarioId,
      advisor_note: advisorNote,
    });
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 4000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advisor controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">Price floor</label>
            <span className="fb-data text-sm font-semibold text-ink">
              {formatCurrency(floorPrice)}
            </span>
          </div>
          <Slider
            min={min}
            max={max}
            step={1000}
            value={[floorPrice]}
            onValueChange={(value) => setFloorPrice(value[0])}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Lock scenario</label>
          <Select value={lockedScenarioId} onValueChange={setLockedScenarioId}>
            <SelectTrigger>
              <SelectValue placeholder="No lock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LOCK}>No lock</SelectItem>
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Advisor note</label>
          <Textarea
            placeholder="Add context or override reasoning…"
            value={advisorNote}
            onChange={(e) => setAdvisorNote(e.target.value)}
          />
        </div>

        <Button onClick={handleApply} className="w-full">
          <Sym name="tune" sm />
          Apply override
        </Button>

        {justApplied && (
          <p className="flex items-center gap-1.5 text-sm text-ok">
            <Sym name="check_circle" className="text-[18px]" />
            Override applied. Re-running the analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
