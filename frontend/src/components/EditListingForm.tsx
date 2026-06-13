import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateListing } from "@/lib/api";
import type { ListingData } from "@/lib/types";

interface EditListingFormProps {
  listingId: string;
  listing: ListingData;
}

function priceLabel(index: number, total: number): string {
  if (index === 0) return "Original price";
  if (index === total - 1) return "Current price";
  return `Price cut ${index}`;
}

export function EditListingForm({ listingId, listing }: EditListingFormProps) {
  const [prices, setPrices] = useState<string[]>(listing.price_cut_history.map(String));
  const [daysOnMarket, setDaysOnMarket] = useState(String(listing.days_on_market));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setPrices(listing.price_cut_history.map(String));
    setDaysOnMarket(String(listing.days_on_market));
  }, [listing.price_cut_history, listing.days_on_market]);

  const mutation = useMutation({
    mutationFn: () =>
      updateListing(listingId, {
        price_cut_history: prices.map((p) => Number(p)),
        days_on_market: Number(daysOnMarket),
      }),
    onSuccess: (output) => {
      queryClient.setQueryData(["listing", listingId], output);
      toast({ title: "Listing updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update listing", description: error.message, variant: "destructive" });
    },
  });

  const handlePriceChange = (index: number, value: string) => {
    setPrices((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const handleAddPrice = () => {
    setPrices((prev) => [...prev, prev[prev.length - 1] ?? ""]);
  };

  const handleRemovePrice = (index: number) => {
    setPrices((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const isValid =
    prices.length > 0 &&
    prices.every((p) => p.trim() !== "" && Number(p) > 0) &&
    daysOnMarket.trim() !== "" &&
    Number(daysOnMarket) >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Listing Details</CardTitle>
        <CardDescription>
          Update your asking price history and time on market. Saving refreshes your pricing
          strategy with the new information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Price History</label>
          <div className="space-y-2">
            {prices.map((price, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-32 flex-none text-sm text-muted-foreground">
                  {priceLabel(index, prices.length)}
                </span>
                <Input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePrice(index)}
                  disabled={prices.length <= 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddPrice}>
            <Plus className="mr-2 h-4 w-4" />
            Add price update
          </Button>
          <p className="text-xs text-muted-foreground">
            The last entry is treated as your current asking price. Add an entry whenever you
            change your price to track cuts over time.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Days on Market</label>
          <Input
            type="number"
            min={0}
            value={daysOnMarket}
            onChange={(e) => setDaysOnMarket(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Button onClick={() => mutation.mutate()} disabled={!isValid || mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
