import {
  ArrowDown,
  Footprints,
  GraduationCap,
  Home,
  MapPin,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyMap } from "@/components/PropertyMap";
import type { ListingData } from "@/lib/types";

interface PropertyOverviewProps {
  listing: ListingData;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPriceK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

export function PropertyOverview({ listing }: PropertyOverviewProps) {
  const vsMedianPct =
    listing.neighborhood_median > 0
      ? ((listing.current_price - listing.neighborhood_median) / listing.neighborhood_median) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start gap-2 text-xl">
          <MapPin className="mt-1 h-5 w-5 flex-none text-primary" />
          {listing.address}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          {listing.lat != null && listing.lon != null ? (
            <PropertyMap lat={listing.lat} lon={listing.lon} address={listing.address} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
              Map unavailable for this address
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Asking Price</p>
              <p className="text-2xl font-semibold">{formatCurrency(listing.current_price)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Days on Market</p>
              <Badge variant={listing.days_on_market > 90 ? "destructive" : "secondary"}>
                {listing.days_on_market} days
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Price History</p>
              {listing.price_cuts > 0 ? (
                <p className="flex items-center gap-1 font-semibold">
                  <ArrowDown className="h-4 w-4 text-destructive" />
                  {listing.price_cut_history.map((price) => formatPriceK(price)).join(" → ")}
                </p>
              ) : (
                <p className="font-semibold">{formatPriceK(listing.current_price)} (no cuts)</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">vs. Neighborhood Median</p>
              <p
                className={`flex items-center gap-1 font-semibold ${
                  vsMedianPct > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                {vsMedianPct > 0 ? "+" : ""}
                {vsMedianPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Home className="h-3.5 w-3.5" /> Neighborhood Median
            </p>
            <p className="font-semibold">{formatCurrency(listing.neighborhood_median)}</p>
            <p className="text-xs text-muted-foreground">{listing.county_name} (Census)</p>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PiggyBank className="h-3.5 w-3.5" /> Mortgage Rate
            </p>
            <p className="font-semibold">{listing.mortgage_rate.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">30yr fixed (FRED)</p>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Median Income
            </p>
            <p className="font-semibold">{formatCurrency(listing.median_household_income)}</p>
            <p className="text-xs text-muted-foreground">{listing.county_name} (Census)</p>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" /> School Index
            </p>
            <p className="font-semibold">{listing.school_rating} / 10</p>
            <p className="text-xs text-muted-foreground">Education attainment proxy</p>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Footprints className="h-3.5 w-3.5" /> Walk Score
            </p>
            <p className="font-semibold">{listing.walk_score} / 100</p>
            <p className="text-xs text-muted-foreground">Population density proxy</p>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Home className="h-3.5 w-3.5" /> Median Rent
            </p>
            <p className="font-semibold">{formatCurrency(listing.median_rent)}/mo</p>
            <p className="text-xs text-muted-foreground">{listing.county_name} (Census)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
