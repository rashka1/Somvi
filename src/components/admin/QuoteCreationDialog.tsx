import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calculator, DollarSign } from "lucide-react";

interface RFQItem {
  id: number;
  materialName: string;
  quantity: number;
  unit: string | null;
}

interface RFQ {
  id: number;
  rfqNumber: string;
  projectName: string;
  items: RFQItem[];
}

interface SupplierPrice {
  supplierId: number | null;
  unitPrice: string;
  totalPrice: number;
}

interface MaterialPricing {
  itemId: number;
  suppliers: {
    supplier1: SupplierPrice | null;
    supplier2: SupplierPrice | null;
    supplier3: SupplierPrice | null;
    supplier4: SupplierPrice | null;
    supplier5: SupplierPrice | null;
  };
  suppliersToShow: number; // How many suppliers to display (1-5)
}

interface QuoteCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQ | null;
}

export default function QuoteCreationDialog({
  open,
  onOpenChange,
  rfq,
}: QuoteCreationDialogProps) {
  const { toast } = useToast();
  const [materialPricing, setMaterialPricing] = useState<Record<number, MaterialPricing>>({});
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [taxRate, setTaxRate] = useState("16"); // Default 16% VAT

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  // Fetch settings for defaults
  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  // Initialize pricing when RFQ changes
  useEffect(() => {
    if (rfq?.items) {
      const initialPricing: Record<number, MaterialPricing> = {};
      rfq.items.forEach(item => {
        initialPricing[item.id] = {
          itemId: item.id,
          suppliers: {
            supplier1: null,
            supplier2: null,
            supplier3: null,
            supplier4: null,
            supplier5: null,
          },
          suppliersToShow: 1, // Default to showing 1 supplier
        };
      });
      setMaterialPricing(initialPricing);
    }
  }, [rfq]);

  // Load defaults from settings
  useEffect(() => {
    if (settings) {
      if (settings.taxRate) setTaxRate(settings.taxRate);
      if (settings.deliveryBaseRate) setDeliveryFee(settings.deliveryBaseRate);
    }
  }, [settings]);

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/rfqs/${rfq?.id}/quotes`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Quote Created",
        description: "Quotation has been created successfully with supplier prices.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const handleSupplierChange = (itemId: number, supplierNum: number, supplierId: number) => {
    setMaterialPricing(prev => {
      const key = `supplier${supplierNum}` as keyof typeof prev[itemId]['suppliers'];
      const existing = prev[itemId]?.suppliers[key];
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          suppliers: {
            ...prev[itemId].suppliers,
            [key]: {
              supplierId,
              unitPrice: existing?.unitPrice || "0",
              totalPrice: existing?.totalPrice || 0,
            },
          },
        },
      };
    });
  };

  const handlePriceChange = (itemId: number, supplierNum: number, unitPrice: string) => {
    setMaterialPricing(prev => {
      const item = rfq?.items.find(i => i.id === itemId);
      const quantity = item?.quantity || 1;
      const key = `supplier${supplierNum}` as keyof typeof prev[itemId]['suppliers'];
      const existing = prev[itemId]?.suppliers[key];
      
      const totalPrice = (parseFloat(unitPrice) || 0) * quantity;
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          suppliers: {
            ...prev[itemId].suppliers,
            [key]: {
              supplierId: existing?.supplierId || null,
              unitPrice,
              totalPrice,
            },
          },
        },
      };
    });
  };

  const handleSuppliersToShowChange = (itemId: number, count: number) => {
    setMaterialPricing(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        suppliersToShow: count,
      },
    }));
  };

  const calculateTotals = () => {
    // Use the first supplier's price for subtotal calculation
    const subtotal = Object.values(materialPricing).reduce(
      (sum, pricing) => {
        const firstSupplier = pricing.suppliers.supplier1;
        return sum + (firstSupplier?.totalPrice || 0);
      },
      0
    );
    
    const delivery = parseFloat(deliveryFee) || 0;
    const taxAmount = (subtotal * (parseFloat(taxRate) / 100)) || 0;
    
    // Total customer price (what we charge the client)
    const totalAmount = subtotal + delivery + taxAmount;
    
    // Calculate markup/profit (profit is separate, not added to customer price)
    const markupPercent = parseFloat(settings?.defaultMarkup || "15");
    const profit = (subtotal * markupPercent) / 100;
    
    // Grand total is for display only (customer pays totalAmount, we keep profit)
    const grandTotal = totalAmount + profit;

    return {
      subtotal,
      delivery,
      taxAmount,
      totalAmount,  // Customer-facing total (subtotal + delivery + tax)
      profit,       // Our profit/markup (separate)
      grandTotal,   // Display only: totalAmount + profit
    };
  };

  const handleCreateQuote = () => {
    // Validate that all materials have at least one supplier with valid price
    const invalidItems = rfq?.items.filter(item => {
      const pricing = materialPricing[item.id];
      if (!pricing) return true;
      
      // Check if at least supplier1 has data
      const supplier1 = pricing.suppliers.supplier1;
      return !supplier1 || !supplier1.supplierId || parseFloat(supplier1.unitPrice) <= 0;
    });

    if (invalidItems && invalidItems.length > 0) {
      toast({
        title: "Invalid Quote Data",
        description: `Please enter valid supplier and price for all materials (at least Supplier 1). ${invalidItems.length} item(s) incomplete.`,
        variant: "destructive",
      });
      return;
    }

    const totals = calculateTotals();

    // Prepare quote data with multi-supplier structure
    const quoteData = {
      items: Object.values(materialPricing).map(pricing => {
        // Collect all supplier prices for this material
        const supplierPrices: any = {};
        let suppliersToShow = 0;
        
        ['supplier1', 'supplier2', 'supplier3', 'supplier4', 'supplier5'].forEach((key, index) => {
          const supplierData = pricing.suppliers[key as keyof typeof pricing.suppliers];
          if (supplierData && supplierData.supplierId && parseFloat(supplierData.unitPrice) > 0) {
            supplierPrices[key] = {
              supplierId: supplierData.supplierId,
              unitPrice: parseFloat(supplierData.unitPrice),
              totalPrice: supplierData.totalPrice,
            };
            suppliersToShow = index + 1; // Track highest supplier number
          }
        });
        
        return {
          itemId: pricing.itemId,
          supplierPrices,
          suppliersToShow: pricing.suppliersToShow || suppliersToShow,
        };
      }),
      deliveryFee: parseFloat(deliveryFee),
      taxRate: parseFloat(taxRate),
      taxAmount: totals.taxAmount,
      subtotal: totals.subtotal,
      profit: totals.profit,
      totalAmount: totals.totalAmount,
    };

    createQuoteMutation.mutate(quoteData);
  };

  const totals = calculateTotals();

  if (!rfq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Quotation - {rfq.rfqNumber}
          </DialogTitle>
          <DialogDescription>
            Enter supplier prices for each material to generate the quotation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material Pricing - Multiple Suppliers */}
          {rfq.items.map((item) => {
            const pricing = materialPricing[item.id];
            if (!pricing) return null;

            return (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{item.materialName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} {item.unit || 'units'}
                    </p>
                  </div>
                  <Select
                    value={pricing.suppliersToShow.toString()}
                    onValueChange={(value) => handleSuppliersToShowChange(item.id, parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Show 1 Supplier</SelectItem>
                      <SelectItem value="2">Show 2 Suppliers</SelectItem>
                      <SelectItem value="3">Show 3 Suppliers</SelectItem>
                      <SelectItem value="4">Show 4 Suppliers</SelectItem>
                      <SelectItem value="5">Show 5 Suppliers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  {[1, 2, 3, 4, 5].slice(0, pricing.suppliersToShow).map((num) => {
                    const key = `supplier${num}` as keyof typeof pricing.suppliers;
                    const supplierData = pricing.suppliers[key];
                    
                    return (
                      <div key={num} className="grid grid-cols-3 gap-2 items-center p-2 bg-muted/30 rounded">
                        <div className="text-sm font-medium">Supplier {num}</div>
                        <Select
                          value={supplierData?.supplierId?.toString() || ""}
                          onValueChange={(value) => handleSupplierChange(item.id, num, parseInt(value))}
                        >
                          <SelectTrigger data-testid={`select-supplier-${item.id}-${num}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={supplierData?.unitPrice || ""}
                            onChange={(e) => handlePriceChange(item.id, num, e.target.value)}
                            placeholder="Price"
                            data-testid={`input-price-${item.id}-${num}`}
                          />
                          <div className="flex items-center justify-end px-2 text-sm font-medium">
                            ${(supplierData?.totalPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Additional Charges */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                data-testid="input-delivery-fee"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                data-testid="input-tax-rate"
              />
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="space-y-2 p-4 bg-primary/5 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal (Materials):</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee:</span>
              <span className="font-medium">${totals.delivery.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({taxRate}%):</span>
              <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total (Customer Price):</span>
                <span className="text-primary">${totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>+ Our Profit/Markup ({settings?.defaultMarkup || "15"}%):</span>
              <span className="font-medium text-green-600">${totals.profit.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Revenue:</span>
                <span className="font-bold text-green-700">${totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-quote"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateQuote}
            disabled={createQuoteMutation.isPending}
            data-testid="button-save-quote"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {createQuoteMutation.isPending ? "Creating..." : "Create Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
