import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sym } from "@/components/ui/sym";
import { PropertyMap } from "@/components/PropertyMap";
import type { ListingData } from "@/lib/types";

interface PropertyOverviewProps {
  listing: ListingData;
  lastUpdated: string;
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

export function PropertyOverview({ listing, lastUpdated }: PropertyOverviewProps) {
  const vsMedianPct =
    listing.neighborhood_median > 0
      ? ((listing.current_price - listing.neighborhood_median) / listing.neighborhood_median) * 100
      : 0;
  const aboveMedian = vsMedianPct > 0;

  const stats = [
    {
      icon: "home_work",
      label: "Neighborhood median",
      value: formatCurrency(listing.neighborhood_median),
      source: `${listing.county_name} · Census`,
    },
    {
      icon: "savings",
      label: "Mortgage rate",
      value: `${listing.mortgage_rate.toFixed(2)}%`,
      source: "30yr fixed · FRED",
    },
    {
      icon: "account_balance_wallet",
      label: "Median income",
      value: formatCurrency(listing.median_household_income),
      source: `${listing.county_name} · Census`,
    },
    {
      icon: "school",
      label: "School index",
      value: `${listing.school_rating} / 10`,
      source: "Education attainment proxy",
    },
    {
      icon: "directions_walk",
      label: "Walk score",
      value: `${listing.walk_score} / 100`,
      source: "Population density proxy",
    },
    {
      icon: "home_work",
      label: "Median rent",
      value: `${formatCurrency(listing.median_rent)}/mo`,
      source: `${listing.county_name} · Census`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{listing.address}</CardTitle>
        <p className="fb-data text-xs text-ink-2">
          Last updated {new Date(lastUpdated).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          {listing.lat != null && listing.lon != null ? (
            <PropertyMap lat={listing.lat} lon={listing.lon} address={listing.address} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-[var(--r-lg)] border border-rule text-sm text-ink-2">
              Map unavailable for this address
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-ink-2">Asking price</p>
              <p className="fb-data text-2xl font-semibold text-ink">
                {formatCurrency(listing.current_price)}
              </p>
            </div>

            <div>
              <p className="text-sm text-ink-2">Days on market</p>
              <Badge variant={listing.days_on_market > 90 ? "destructive" : "secondary"}>
                {listing.days_on_market} days
              </Badge>
            </div>

            <div>
              <p className="text-sm text-ink-2">Price history</p>
              {listing.price_cuts > 0 ? (
                <p className="flex items-center gap-1 font-semibold text-ink">
                  <Sym name="arrow_downward" className="text-[18px] text-redline" />
                  <span className="fb-data">
                    {listing.price_cut_history.map((price) => formatPriceK(price)).join(" → ")}
                  </span>
                </p>
              ) : (
                <p className="fb-data font-semibold text-ink">
                  {formatPriceK(listing.current_price)} (no cuts)
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-ink-2">vs. neighborhood median</p>
              <p
                className={`flex items-center gap-1 font-semibold ${
                  aboveMedian ? "text-warn" : "text-ok"
                }`}
              >
                <Sym
                  name={aboveMedian ? "trending_up" : "trending_down"}
                  className="text-[18px]"
                />
                <span className="fb-data">
                  {aboveMedian ? "+" : ""}
                  {vsMedianPct.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-rule pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-ink-2">
                <Sym name={stat.icon} className="text-[16px]" /> {stat.label}
              </p>
              <p className="fb-data font-semibold text-ink">{stat.value}</p>
              <p className="flex items-center gap-1 text-xs text-ink-3">
                <Sym name="database" className="text-[14px]" /> {stat.source}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
