import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Download, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface SupplierPrice {
  basePrice: number;
  markup: number;
}

interface RFQItemWithPricing extends RFQItem {
  suppliers: {
    supplier1: SupplierPrice;
    supplier2: SupplierPrice;
    supplier3: SupplierPrice;
    supplier4: SupplierPrice;
    supplier5: SupplierPrice;
  };
}

interface RFQItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface RFQ {
  id: string;
  date: string;
  client: {
    name: string;
    company: string;
    email: string;
    phone: string;
  };
  items: RFQItemWithPricing[];
  status: "Pending" | "Quoted" | "Completed";
  deliveryFee?: number;
  taxes?: number;
}

const RFQDetails = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [taxes, setTaxes] = useState(0);

  useEffect(() => {
    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    const foundRFQ = storedRFQs.find((r: RFQ) => r.id === id);
    
    if (foundRFQ) {
      // Initialize supplier data if not present
      const itemsWithSuppliers = foundRFQ.items.map((item: RFQItem) => ({
        ...item,
        suppliers: (item as any).suppliers || {
          supplier1: { basePrice: 0, markup: 0 },
          supplier2: { basePrice: 0, markup: 0 },
          supplier3: { basePrice: 0, markup: 0 },
          supplier4: { basePrice: 0, markup: 0 },
          supplier5: { basePrice: 0, markup: 0 },
        },
      }));

      setRfq({
        ...foundRFQ,
        items: itemsWithSuppliers,
        deliveryFee: foundRFQ.deliveryFee || 0,
        taxes: foundRFQ.taxes || 0,
      });
      setDeliveryFee(foundRFQ.deliveryFee || 0);
      setTaxes(foundRFQ.taxes || 0);
    }
  }, [id]);

  const updateSupplierPrice = (
    itemId: string,
    supplier: keyof RFQItemWithPricing["suppliers"],
    field: "basePrice" | "markup",
    value: number
  ) => {
    if (!rfq) return;

    const updatedItems = rfq.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          suppliers: {
            ...item.suppliers,
            [supplier]: {
              ...item.suppliers[supplier],
              [field]: value,
            },
          },
        };
      }
      return item;
    });

    setRfq({ ...rfq, items: updatedItems });
  };

  const getDisplayedPrice = (supplier: SupplierPrice) => {
    return supplier.basePrice + supplier.markup;
  };

  const calculateItemTotal = (item: RFQItemWithPricing, supplier: keyof RFQItemWithPricing["suppliers"]) => {
    const displayedPrice = getDisplayedPrice(item.suppliers[supplier]);
    return displayedPrice * item.quantity;
  };

  const calculateProfit = (item: RFQItemWithPricing, supplier: keyof RFQItemWithPricing["suppliers"]) => {
    const profit = item.suppliers[supplier].markup * item.quantity;
    return profit;
  };

  const calculateTotalRFQValue = () => {
    if (!rfq) return 0;
    
    let total = 0;
    rfq.items.forEach((item) => {
      const suppliers = ["supplier1", "supplier2", "supplier3", "supplier4", "supplier5"] as const;
      suppliers.forEach((supplier) => {
        total += calculateItemTotal(item, supplier);
      });
    });
    
    return total;
  };

  const calculateGrandTotal = () => {
    return calculateTotalRFQValue() + deliveryFee + taxes;
  };

  const saveRFQ = () => {
    if (!rfq) return;

    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    const updatedRFQs = storedRFQs.map((r: RFQ) =>
      r.id === rfq.id ? { ...rfq, deliveryFee, taxes, status: "Quoted" } : r
    );

    localStorage.setItem("rfqs", JSON.stringify(updatedRFQs));
    
    toast({
      title: "RFQ Saved",
      description: "Pricing information has been saved successfully.",
    });
  };

  const markAsCompleted = () => {
    if (!rfq) return;

    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    const updatedRFQs = storedRFQs.map((r: RFQ) =>
      r.id === rfq.id
        ? { ...rfq, deliveryFee, taxes, status: "Completed", completedDate: new Date().toISOString() }
        : r
    );

    localStorage.setItem("rfqs", JSON.stringify(updatedRFQs));
    
    toast({
      title: "RFQ Completed",
      description: "This RFQ has been marked as completed.",
    });

    setLocation("/admin");
  };

  const generatePDF = () => {
    if (!rfq) return;

    const doc = new jsPDF("landscape");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(26, 86, 219);
    doc.text("SOMVI", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Construction Materials & Logistics", 20, 27);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("QUOTATION", 20, 40);

    // RFQ Details
    doc.setFontSize(10);
    doc.text(`RFQ ID: ${rfq.id}`, 20, 50);
    doc.text(`Client: ${rfq.client.name}`, 20, 57);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 64);

    // Items Table with all suppliers
    const tableData = rfq.items.map((item) => [
      item.name,
      item.unit,
      item.quantity.toString(),
      `$${getDisplayedPrice(item.suppliers.supplier1).toFixed(2)}`,
      `$${getDisplayedPrice(item.suppliers.supplier2).toFixed(2)}`,
      `$${getDisplayedPrice(item.suppliers.supplier3).toFixed(2)}`,
      `$${getDisplayedPrice(item.suppliers.supplier4).toFixed(2)}`,
      `$${getDisplayedPrice(item.suppliers.supplier5).toFixed(2)}`,
      `$${(
        calculateItemTotal(item, "supplier1") +
        calculateItemTotal(item, "supplier2") +
        calculateItemTotal(item, "supplier3") +
        calculateItemTotal(item, "supplier4") +
        calculateItemTotal(item, "supplier5")
      ).toFixed(2)}`,
    ]);

    (doc as any).autoTable({
      startY: 75,
      head: [["Material", "Unit", "Qty", "Supplier 1", "Supplier 2", "Supplier 3", "Supplier 4", "Supplier 5", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [26, 86, 219], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
        8: { cellWidth: 25 },
      },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: $${calculateTotalRFQValue().toFixed(2)}`, 200, finalY);
    doc.text(`Delivery Fee: $${deliveryFee.toFixed(2)}`, 200, finalY + 7);
    doc.text(`Taxes: $${taxes.toFixed(2)}`, 200, finalY + 14);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(`Grand Total: $${calculateGrandTotal().toFixed(2)}`, 200, finalY + 25);

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100);
    doc.text("Quotation prepared by SOMVI Procurement Team. Valid for 7 days.", 20, finalY + 50);

    doc.save(`SOMVI_Quotation_${rfq.id}.pdf`);

    toast({
      title: "PDF Generated",
      description: "Quotation has been downloaded successfully.",
    });
  };

  if (!rfq) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading RFQ details...</p>
      </div>
    );
  }

  const suppliers = ["supplier1", "supplier2", "supplier3", "supplier4", "supplier5"] as const;

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">RFQ Details: {rfq.id}</h1>
            <p className="text-muted-foreground">{rfq.client.name}</p>
          </div>
        </div>
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="font-medium">{rfq.client.name}</p>
            </div>
            {rfq.client.company && (
              <div>
                <Label className="text-xs text-muted-foreground">Company</Label>
                <p className="font-medium">{rfq.client.company}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{rfq.client.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <p className="font-medium">{rfq.client.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Materials & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Materials & Supplier Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rfq.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Base Price ($)</TableHead>
                        <TableHead>Markup ($)</TableHead>
                        <TableHead>Displayed Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>SOMVI Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier, index) => (
                        <TableRow key={supplier}>
                          <TableCell className="font-medium">Supplier {index + 1}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.suppliers[supplier].basePrice || ""}
                              onChange={(e) =>
                                updateSupplierPrice(item.id, supplier, "basePrice", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.suppliers[supplier].markup || ""}
                              onChange={(e) =>
                                updateSupplierPrice(item.id, supplier, "markup", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ${getDisplayedPrice(item.suppliers[supplier]).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${calculateItemTotal(item, supplier).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            ${calculateProfit(item, supplier).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>RFQ Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Delivery Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Taxes ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxes}
                  onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span>Total RFQ Value:</span>
                <span className="font-bold">${calculateTotalRFQValue().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span>${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>${calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <Button onClick={saveRFQ} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save RFQ
              </Button>
              <Button onClick={generatePDF}>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              <Button onClick={markAsCompleted} variant="default">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RFQDetails;
