import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, Edit, Trash2, Download, MessageCircle, RefreshCw, Plus, ClipboardList, Calculator } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QuoteCreationDialog from "@/components/admin/QuoteCreationDialog";

interface RFQData {
  id: number;
  rfqNumber: string;
  clientId: number;
  projectName: string;
  status: string;
  totalAmount: string | null;
  profit: string | null;
  deliveryFee?: string | null;
  taxAmount?: string | null;
  createdAt: string;
  client: {
    id: number;
    name: string;
    whatsapp: string;
    company: string | null;
  } | null;
  items: Array<{
    id: number;
    materialName: string;
    quantity: number;
    unit: string | null;
    supplierPrices: string | null;
  }>;
}

const RFQManagement = () => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMaterialsDialogOpen, setAddMaterialsDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQData | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("1");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch RFQs with client data
  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery<RFQData[]>({
    queryKey: ["/api/rfqs"],
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch all materials
  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["/api/materials"],
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
  });

  // Update RFQ status mutation
  const updateRFQMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/rfqs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Status Updated",
        description: "RFQ status has been updated successfully.",
      });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update RFQ status.",
        variant: "destructive",
      });
    },
  });

  // Delete RFQ mutation
  const deleteRFQMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/rfqs/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "RFQ Deleted",
        description: "The RFQ has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete RFQ.",
        variant: "destructive",
      });
    },
  });

  // Add material to RFQ mutation
  const addMaterialMutation = useMutation({
    mutationFn: async ({ rfqId, materialId, quantity }: { rfqId: number; materialId: number; quantity: number }) => {
      return await apiRequest(`/api/rfqs/${rfqId}/add-material`, {
        method: "POST",
        body: JSON.stringify({ materialId, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Material Added",
        description: "Material has been added to the RFQ. Update supplier prices to recalculate totals.",
      });
      setAddMaterialsDialogOpen(false);
      setSelectedMaterialId("");
      setMaterialQuantity("1");
      setSelectedCategory("all");
      setSelectedSubcategory("all");
    },
    onError: (error: any) => {
      toast({
        title: "Addition Failed",
        description: error.message || "Failed to add material to RFQ.",
        variant: "destructive",
      });
    },
  });

  // Update prices mutation
  const updatePricesMutation = useMutation({
    mutationFn: async (rfqId: number) => {
      return await apiRequest(`/api/rfqs/${rfqId}/update-prices`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "Prices Updated",
        description: `Market prices refreshed. Quote is now version ${data.version}. Status set to pending - please review and create new quotation.`,
      });
      setViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update prices.",
        variant: "destructive",
      });
    },
  });

  // Get unique categories and subcategories for filtering
  const categories = Array.from(new Set(materials.filter((m: any) => m.active).map((m: any) => m.category))).sort();
  const subcategories = selectedCategory !== "all" 
    ? Array.from(new Set(materials.filter((m: any) => m.active && m.category === selectedCategory && m.subcategory).map((m: any) => m.subcategory))).sort()
    : [];

  // Filter materials by category and subcategory
  const filteredMaterials = materials.filter((m: any) => {
    if (!m.active) return false;
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    if (selectedSubcategory !== "all" && m.subcategory !== selectedSubcategory) return false;
    return true;
  });

  // Generate PDF with jsPDF
  const generatePDF = (rfq: RFQData) => {
    const doc = new jsPDF();
    
    // Header - SOMVI Branding
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Primary color
    doc.text("SOMVI Somalia", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Construction Supply Chain Platform", 20, 27);
    doc.text("Simplifying Construction Procurement", 20, 32);
    
    // Contact Info
    doc.setFontSize(9);
    doc.text("Phone: +252 615 401 195", 150, 20);
    doc.text("Email: info@somvi.so", 150, 25);
    doc.text("WhatsApp: +252615401195", 150, 30);
    
    // Line separator
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
    // Get version from first RFQ item
    const version = rfq.items[0]?.supplierPrices ? 
      (JSON.parse(rfq.items[0].supplierPrices).priceVersion || 1) : 1;
    
    // RFQ Information
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Quotation - ${rfq.rfqNumber} (v${version})`, 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(rfq.createdAt).toLocaleDateString()}`, 20, 58);
    doc.text(`Version: ${version}`, 20, 64);
    doc.text(`Status: ${rfq.status.toUpperCase()}`, 20, 70);
    
    // Client Information
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Client Information:", 20, 82);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${rfq.client?.name || 'N/A'}`, 20, 90);
    if (rfq.client?.company) {
      doc.text(`Company: ${rfq.client.company}`, 20, 96);
    }
    doc.text(`WhatsApp: ${rfq.client?.whatsapp || 'N/A'}`, 20, rfq.client?.company ? 102 : 96);
    doc.text(`Project: ${rfq.projectName}`, 20, rfq.client?.company ? 108 : 102);
    
    // Materials Table
    const startY = rfq.client?.company ? 121 : 115;
    
    // Determine maximum number of suppliers to show across all items
    let maxSuppliers = 1;
    rfq.items.forEach(item => {
      if (item.supplierPrices) {
        const parsed = JSON.parse(item.supplierPrices);
        const suppliersToShow = parsed.suppliersToShow || 1;
        maxSuppliers = Math.max(maxSuppliers, suppliersToShow);
      }
    });

    // Parse supplier prices and create table data with multiple supplier columns
    const tableData = rfq.items.map(item => {
      const supplierPrices = item.supplierPrices ? JSON.parse(item.supplierPrices) : {};
      const row: any[] = [
        item.materialName,
        item.unit || 'unit',
        item.quantity.toString()
      ];
      
      // Add price columns for each supplier
      for (let i = 1; i <= maxSuppliers; i++) {
        const supplierKey = `supplier${i}`;
        const supplierData = supplierPrices[supplierKey];
        const price = supplierData?.unitPrice || '-';
        row.push(price !== '-' ? `$${parseFloat(price).toFixed(2)}` : '-');
      }
      
      // Add total column (using supplier1's total)
      const supplier1 = supplierPrices.supplier1;
      const total = supplier1?.totalPrice || 0;
      row.push(`$${parseFloat(total).toFixed(2)}`);
      
      return row;
    });
    
    // Build table headers dynamically
    const headers = ['Material', 'Unit', 'Qty'];
    for (let i = 1; i <= maxSuppliers; i++) {
      headers.push(`Supplier ${i}`);
    }
    headers.push('Total');

    // Build column styles dynamically
    const baseWidth = 190; // Total usable width
    const materialWidth = 55;
    const unitWidth = 18;
    const qtyWidth = 15;
    const totalWidth = 25;
    const supplierWidth = (baseWidth - materialWidth - unitWidth - qtyWidth - totalWidth) / maxSuppliers;
    
    const columnStyles: any = {
      0: { cellWidth: materialWidth },
      1: { cellWidth: unitWidth },
      2: { cellWidth: qtyWidth },
    };
    
    for (let i = 0; i < maxSuppliers; i++) {
      columnStyles[3 + i] = { cellWidth: supplierWidth };
    }
    columnStyles[3 + maxSuppliers] = { cellWidth: totalWidth };
    
    autoTable(doc, {
      startY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles,
    });
    
    // Totals section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Calculate materials subtotal from items (using supplier1's total)
    const materialsSubtotal = rfq.items.reduce((sum, item) => {
      const supplierPrices = item.supplierPrices ? JSON.parse(item.supplierPrices) : {};
      const supplier1 = supplierPrices.supplier1;
      const totalPrice = supplier1?.totalPrice || 0;
      return sum + parseFloat(totalPrice);
    }, 0);
    
    const deliveryFee = parseFloat(rfq.deliveryFee || '0');
    const taxAmount = parseFloat(rfq.taxAmount || '0');
    const totalAmount = parseFloat(rfq.totalAmount || '0');
    
    doc.setFontSize(11);
    doc.text(`Materials Subtotal:`, 130, finalY);
    doc.text(`$${materialsSubtotal.toFixed(2)}`, 180, finalY, { align: 'right' });
    
    doc.text(`Delivery Fee:`, 130, finalY + 7);
    doc.text(`$${deliveryFee.toFixed(2)}`, 180, finalY + 7, { align: 'right' });
    
    doc.text(`Tax (VAT):`, 130, finalY + 14);
    doc.text(`$${taxAmount.toFixed(2)}`, 180, finalY + 14, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount:`, 130, finalY + 24);
    doc.text(`$${totalAmount.toFixed(2)}`, 180, finalY + 24, { align: 'right' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    const footerY = doc.internal.pageSize.height - 20;
    doc.text("Thank you for choosing SOMVI Somalia!", 105, footerY, { align: 'center' });
    doc.text("Your trusted partner in construction supply chain", 105, footerY + 5, { align: 'center' });
    
    // Save PDF
    doc.save(`SOMVI_Quotation_${rfq.rfqNumber}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Quotation ${rfq.rfqNumber} has been downloaded.`,
    });
  };

  // Send WhatsApp quotation
  const sendWhatsApp = (rfq: RFQData) => {
    // First, generate and download the PDF
    generatePDF(rfq);
    
    // Then open WhatsApp with a message
    const clientName = rfq.client?.name || 'Valued Client';
    const projectName = rfq.projectName;
    const whatsapp = rfq.client?.whatsapp?.replace(/[^0-9]/g, '') || '';
    
    const message = `Hello ${clientName},\n\nYour quotation for *${projectName}* is ready!\n\n📋 RFQ Number: ${rfq.rfqNumber}\n💰 Total Amount: $${parseFloat(rfq.totalAmount || '0').toFixed(2)}\n\n✅ The quotation PDF has been downloaded. Please attach it to this conversation.\n\nThank you for choosing SOMVI Somalia! 🏗️`;
    
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    
    // Small delay to ensure PDF downloads first
    setTimeout(() => {
      window.open(url, '_blank');
      
      toast({
        title: "PDF Downloaded & WhatsApp Opened",
        description: "Now attach the PDF to the WhatsApp conversation.",
        duration: 5000,
      });
    }, 500);
  };

  const handleView = (rfq: RFQData) => {
    setSelectedRFQ(rfq);
    setViewDialogOpen(true);
  };

  const handleEdit = (rfq: RFQData) => {
    setSelectedRFQ(rfq);
    setEditStatus(rfq.status);
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedRFQ && editStatus) {
      updateRFQMutation.mutate({ id: selectedRFQ.id, status: editStatus });
    }
  };

  const handleDelete = (id: number) => {
    deleteRFQMutation.mutate(id);
  };

  const handleAddMaterials = (rfq: RFQData) => {
    setSelectedRFQ(rfq);
    setSelectedMaterialId("");
    setMaterialQuantity("1");
    setAddMaterialsDialogOpen(true);
  };

  const handleCreateQuote = (rfq: RFQData) => {
    setSelectedRFQ(rfq);
    setQuoteDialogOpen(true);
  };

  const handleSubmitAddMaterial = () => {
    if (selectedRFQ && selectedMaterialId && materialQuantity) {
      const quantity = parseInt(materialQuantity);
      if (quantity > 0) {
        addMaterialMutation.mutate({
          rfqId: selectedRFQ.id,
          materialId: parseInt(selectedMaterialId),
          quantity,
        });
      }
    }
  };

  const handleUpdatePrices = (rfq: RFQData) => {
    if (confirm(`Update market prices for ${rfq.rfqNumber}? This will increment the version and reset status to pending.`)) {
      updatePricesMutation.mutate(rfq.id);
    }
  };

  const handleResendQuote = (rfq: RFQData) => {
    // Resend uses the existing quote data with updated version messaging
    const clientName = rfq.client?.name || 'Valued Client';
    const projectName = rfq.projectName;
    const whatsapp = rfq.client?.whatsapp?.replace(/[^0-9]/g, '') || '';
    
    // Get version from RFQ items (first item's priceVersion)
    const version = rfq.items[0]?.supplierPrices ? 
      (JSON.parse(rfq.items[0].supplierPrices).priceVersion || 1) : 1;
    
    const message = `Hello ${clientName},\n\n📋 Updated quotation for *${projectName}* (Version ${version})\n\n🔄 RFQ Number: ${rfq.rfqNumber}\n💰 Total Amount: $${parseFloat(rfq.totalAmount || '0').toFixed(2)}\n\n✅ The quotation PDF has been downloaded. Please attach it to this conversation.\n\nThank you for choosing SOMVI Somalia! 🏗️`;
    
    // Generate PDF and send WhatsApp
    generatePDF(rfq);
    
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    
    setTimeout(() => {
      window.open(url, '_blank');
      
      toast({
        title: "Updated Quote Sent",
        description: `Version ${version} PDF downloaded. Please attach to WhatsApp.`,
        duration: 5000,
      });
    }, 500);
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "quoted":
        return "bg-blue-500 hover:bg-blue-600";
      case "approved":
        return "bg-purple-500 hover:bg-purple-600";
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Filter RFQs based on status
  const filteredRFQs = rfqs.filter(rfq => {
    const status = rfq.status.toLowerCase();
    switch (statusFilter) {
      case "all":
        return true;
      case "active":
        return status === "pending" || status === "quoted";
      case "pending":
        return status === "pending";
      case "quoted":
        return status === "quoted";
      case "completed":
        return status === "completed";
      default:
        return true;
    }
  });

  if (rfqsLoading) {
    return (
      <AdminLayout>
        <div className="section-container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading RFQs...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="section-container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>RFQ Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage quotations, generate PDFs, and send via WhatsApp
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RFQs</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="quoted">Quoted Only</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setLocation("/admin/rfqs/new")}
                data-testid="button-add-rfq-management"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Add RFQ
              </Button>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] })}
                data-testid="button-refresh-rfqs"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRFQs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No RFQs found.</p>
                <Button onClick={() => setLocation("/platform")}>
                  Go to Client Portal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRFQs.map((rfq) => (
                      <TableRow key={rfq.id} data-testid={`row-rfq-${rfq.id}`}>
                        <TableCell className="font-medium" data-testid={`text-rfq-number-${rfq.id}`}>
                          {rfq.rfqNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rfq.client?.name || 'Unknown'}</p>
                            {rfq.client?.company && (
                              <p className="text-xs text-muted-foreground">{rfq.client.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-whatsapp-${rfq.id}`}>
                          {rfq.client?.whatsapp || 'N/A'}
                        </TableCell>
                        <TableCell data-testid={`text-project-${rfq.id}`}>
                          {rfq.projectName}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(rfq.status)} data-testid={`badge-status-${rfq.id}`}>
                            {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-total-${rfq.id}`}>
                          ${parseFloat(rfq.totalAmount || '0').toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600" data-testid={`text-profit-${rfq.id}`}>
                          ${parseFloat(rfq.profit || '0').toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(rfq)}
                              data-testid={`button-view-${rfq.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(rfq)}
                              data-testid={`button-edit-${rfq.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generatePDF(rfq)}
                              data-testid={`button-pdf-${rfq.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateQuote(rfq)}
                              data-testid={`button-create-quote-${rfq.id}`}
                              className="bg-primary/10 hover:bg-primary/20"
                            >
                              <Calculator className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsApp(rfq)}
                              data-testid={`button-whatsapp-${rfq.id}`}
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddMaterials(rfq)}
                              data-testid={`button-add-materials-${rfq.id}`}
                              className="bg-blue-50 hover:bg-blue-100"
                            >
                              <Plus className="w-4 h-4 text-blue-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  data-testid={`button-delete-${rfq.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete RFQ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete RFQ {rfq.rfqNumber}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(rfq.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>RFQ Details - {selectedRFQ?.rfqNumber}</DialogTitle>
              <DialogDescription>
                Complete information about this quotation request
              </DialogDescription>
            </DialogHeader>
            
            {selectedRFQ && (
              <div className="space-y-6 py-4">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedRFQ.client?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Company</Label>
                      <p className="font-medium">{selectedRFQ.client?.company || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                      <p className="font-medium">{selectedRFQ.client?.whatsapp || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Project</Label>
                      <p className="font-medium">{selectedRFQ.projectName}</p>
                    </div>
                  </div>
                </div>

                {/* RFQ Details */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">RFQ Details</h3>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge className={getStatusColor(selectedRFQ.status)}>
                        {selectedRFQ.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Amount</Label>
                      <p className="font-medium text-lg">
                        ${parseFloat(selectedRFQ.totalAmount || '0').toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Profit</Label>
                      <p className="font-medium text-lg text-green-600">
                        ${parseFloat(selectedRFQ.profit || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Materials List */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Materials ({selectedRFQ.items.length})</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRFQ.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.materialName}</TableCell>
                            <TableCell>{item.unit || 'unit'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedRFQ && (
                <>
                  {selectedRFQ.status === 'quoted' && (
                    <>
                      <Button 
                        onClick={() => handleUpdatePrices(selectedRFQ)} 
                        variant="outline"
                        disabled={updatePricesMutation.isPending}
                        data-testid="button-update-prices"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {updatePricesMutation.isPending ? "Updating..." : "Update Prices"}
                      </Button>
                      <Button 
                        onClick={() => handleResendQuote(selectedRFQ)} 
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        data-testid="button-resend-quote"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Resend Quote
                      </Button>
                    </>
                  )}
                  <Button onClick={() => generatePDF(selectedRFQ)} data-testid="button-download-pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    onClick={() => sendWhatsApp(selectedRFQ)} 
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-send-whatsapp"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send WhatsApp
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Status Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit RFQ Status</DialogTitle>
              <DialogDescription>
                Update the status of {selectedRFQ?.rfqNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="edit-status" data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={updateRFQMutation.isPending}
                data-testid="button-save-status"
              >
                {updateRFQMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Materials Dialog */}
        <Dialog open={addMaterialsDialogOpen} onOpenChange={setAddMaterialsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Materials to RFQ</DialogTitle>
              <DialogDescription>
                Add materials to {selectedRFQ?.rfqNumber}. Totals will be automatically recalculated.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Category Filter */}
              <div>
                <Label htmlFor="category-select">Category</Label>
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedSubcategory("all");
                  setSelectedMaterialId("");
                }}>
                  <SelectTrigger id="category-select" data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <Label htmlFor="subcategory-select">Subcategory</Label>
                <Select 
                  value={selectedSubcategory} 
                  onValueChange={(value) => {
                    setSelectedSubcategory(value);
                    setSelectedMaterialId("");
                  }}
                  disabled={selectedCategory === "all" || subcategories.length === 0}
                >
                  <SelectTrigger id="subcategory-select" data-testid="select-subcategory">
                    <SelectValue placeholder="All Subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Material Selection */}
              <div>
                <Label htmlFor="material-select">Select Material</Label>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger id="material-select" data-testid="select-material">
                    <SelectValue placeholder="Choose a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMaterials.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No materials found. Try changing category.
                      </div>
                    ) : (
                      filteredMaterials.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.nameEn}
                          {material.subcategory && ` - ${material.subcategory}`}
                          {` (${material.unit || 'unit'})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material-quantity">Quantity</Label>
                <Input
                  id="material-quantity"
                  type="number"
                  min="1"
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  data-testid="input-material-quantity"
                />
              </div>

              {selectedRFQ && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Current RFQ Details</p>
                  <div className="space-y-1">
                    <p className="text-sm"><strong>Client:</strong> {selectedRFQ.client?.name}</p>
                    <p className="text-sm"><strong>Project:</strong> {selectedRFQ.projectName}</p>
                    <p className="text-sm"><strong>Current Total:</strong> ${parseFloat(selectedRFQ.totalAmount || '0').toFixed(2)}</p>
                    <p className="text-sm"><strong>Items:</strong> {selectedRFQ.items.length}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setAddMaterialsDialogOpen(false)}
                data-testid="button-cancel-add-material"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitAddMaterial} 
                disabled={!selectedMaterialId || !materialQuantity || addMaterialMutation.isPending}
                data-testid="button-submit-add-material"
              >
                {addMaterialMutation.isPending ? "Adding..." : "Add Material"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quote Creation Dialog */}
        <QuoteCreationDialog
          open={quoteDialogOpen}
          onOpenChange={setQuoteDialogOpen}
          rfq={selectedRFQ}
        />
      </div>
    </AdminLayout>
  );
};

export default RFQManagement;
