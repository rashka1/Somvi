import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Percent, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import type { Settings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MarkupManagement = () => {
  const { toast } = useToast();
  const [markup, setMarkup] = useState("");
  const [markupType, setMarkupType] = useState<"flat" | "percentage">("flat");

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.defaultMarkup) {
      setMarkup(settings.defaultMarkup);
    }
    if (settings?.markupType) {
      setMarkupType(settings.markupType as "flat" | "percentage");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { defaultMarkup: string; markupType: string }) => {
      if (settings?.id) {
        return apiRequest(`/api/settings/${settings.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/settings", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Markup Updated",
        description: "Global markup has been updated successfully. All future RFQ calculations will use the new markup.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update markup",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const markupValue = parseFloat(markup);
    if (isNaN(markupValue) || markupValue < 0) {
      toast({
        title: "Invalid Markup",
        description: `Please enter a valid ${markupType === "flat" ? "amount" : "percentage"} (0 or greater)`,
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({ defaultMarkup: markup, markupType });
  };

  // Example calculations
  const exampleSupplierPrice = 100;
  const markupValue = parseFloat(markup) || 0;
  
  let exampleClientPrice: number;
  let exampleProfit: number;
  
  if (markupType === "flat") {
    // Flat markup: client_price = supplier_price + markup
    exampleClientPrice = exampleSupplierPrice + markupValue;
    exampleProfit = exampleClientPrice - exampleSupplierPrice;
  } else {
    // Percentage commission: commission = (percentage / 100) × supplier_price
    exampleProfit = (markupValue / 100) * exampleSupplierPrice;
    exampleClientPrice = exampleSupplierPrice + exampleProfit;
  }

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Markup Management</h1>
          <p className="text-muted-foreground">
            Configure global markup percentage for supplier pricing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Markup Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Global Markup
              </CardTitle>
              <CardDescription>
                Set the default markup percentage applied to all supplier prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Markup Type</Label>
                  <RadioGroup
                    value={markupType}
                    onValueChange={(value) => setMarkupType(value as "flat" | "percentage")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flat" id="flat" data-testid="radio-flat" />
                      <Label htmlFor="flat" className="cursor-pointer font-normal">
                        Flat Amount ($)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" data-testid="radio-percentage" />
                      <Label htmlFor="percentage" className="cursor-pointer font-normal">
                        Percentage (%)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="markup">
                    {markupType === "flat" ? "Markup Amount ($)" : "Markup Percentage (%)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="markup"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={markupType === "flat" ? "e.g., 10" : "e.g., 15"}
                      value={markup}
                      onChange={(e) => setMarkup(e.target.value)}
                      className="pr-8"
                      data-testid="input-markup"
                    />
                    {markupType === "flat" ? (
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {markupType === "flat" 
                      ? "This amount will be added to supplier prices" 
                      : "This percentage will be calculated on supplier prices"}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateSettingsMutation.isPending || isLoading}
                  data-testid="button-save-markup"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Markup"}
                </Button>
              </form>

              {settings?.defaultMarkup && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm font-medium">Current Markup</p>
                  <p className="text-2xl font-bold text-accent">
                    {settings.markupType === "flat" ? "$" : ""}{settings.defaultMarkup}{settings.markupType === "percentage" ? "%" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: {settings.markupType === "flat" ? "Flat Amount" : "Percentage"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formula & Example Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pricing Formula
              </CardTitle>
              <CardDescription>
                How markup is calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formula */}
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {markupType === "flat" ? "Client Price Formula:" : "Commission Formula:"}
                  </p>
                  <code className="text-sm font-mono block bg-background p-2 rounded">
                    {markupType === "flat" 
                      ? "client_price = supplier_price + markup"
                      : "commission = (percentage / 100) × supplier_price"}
                  </code>
                </div>

                {markupType === "percentage" && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Client Price Formula:</p>
                    <code className="text-sm font-mono block bg-background p-2 rounded">
                      client_price = supplier_price + commission
                    </code>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Profit Formula:</p>
                  <code className="text-sm font-mono block bg-background p-2 rounded">
                    profit = client_price - supplier_price
                  </code>
                </div>
              </div>

              {/* Example Calculation */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Example Calculation:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Supplier Price:</span>
                    <span className="font-medium">${exampleSupplierPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Markup:</span>
                    <span className="font-medium">
                      {markupType === "flat" ? "$" : ""}{markupValue}{markupType === "percentage" ? "%" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-accent/10 rounded border border-accent/20">
                    <span className="font-medium">Client Price:</span>
                    <span className="font-bold text-accent">
                      ${exampleClientPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
                    <span className="font-medium">Profit:</span>
                    <span className="font-bold text-green-600">
                      ${exampleProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription>
            When you update the markup percentage, it will be applied to all new RFQ calculations.
            The client price is calculated by multiplying the supplier price by the markup percentage.
            Your profit is the difference between the client price and supplier price.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Markup Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{markupType === "flat" ? "Flat Amount" : "Percentage"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {markupType === "flat" 
                  ? "Fixed dollar amount added to supplier prices" 
                  : "Percentage commission on supplier prices"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">All RFQs</p>
              <p className="text-xs text-muted-foreground mt-1">
                Applies to future RFQ calculations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                Current Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-current-markup">
                {isLoading 
                  ? "..." 
                  : settings?.defaultMarkup 
                    ? `${settings.markupType === "flat" ? "$" : ""}${settings.defaultMarkup}${settings.markupType === "percentage" ? "%" : ""}`
                    : "Not Set"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Active markup {settings?.markupType === "flat" ? "amount" : "percentage"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MarkupManagement;
