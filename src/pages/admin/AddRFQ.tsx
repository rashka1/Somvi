import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, Trash2, Phone, Building2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Material } from "@shared/schema";

interface RFQItem {
  materialId: number;
  materialName: string;
  quantity: number;
  unit: string;
}

interface Client {
  id: number;
  whatsapp: string;
  name: string;
  company: string | null;
}

const AddRFQ = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Client details
  const [whatsapp, setWhatsapp] = useState("");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  
  // Material selection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([]);

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Get unique categories and subcategories
  const categories = Array.from(new Set(materials.filter(m => m.active).map(m => m.category))).sort();
  const subcategories = selectedCategory !== "all" 
    ? Array.from(new Set(materials.filter(m => m.active && m.category === selectedCategory && m.subcategory).map(m => m.subcategory))).sort()
    : [];

  // Filter materials by category, subcategory, and search
  const filteredMaterials = materials.filter((m) => {
    if (!m.active) return false;
    
    // Category filter
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    
    // Subcategory filter
    if (selectedSubcategory !== "all" && m.subcategory !== selectedSubcategory) return false;
    
    // Search filter
    if (searchTerm && !m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !m.category.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Find client by WhatsApp
  const findClientByWhatsapp = (whatsappNumber: string) => {
    const client = clients.find((c) => c.whatsapp === whatsappNumber);
    if (client) {
      setClientId(client.id);
      setClientName(client.name);
      setCompany(client.company || "");
      toast({
        title: "Client Found",
        description: `Existing client: ${client.name}`,
      });
    } else {
      setClientId(null);
      setClientName("");
      setCompany("");
    }
  };

  const handleWhatsappBlur = () => {
    if (whatsapp) {
      findClientByWhatsapp(whatsapp);
    }
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialId || !quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a material and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    const material = materials.find((m) => m.id === parseInt(selectedMaterialId));
    if (!material) return;

    // Check if material already added
    const exists = rfqItems.find((item) => item.materialId === material.id);
    if (exists) {
      toast({
        title: "Already Added",
        description: "This material is already in the RFQ. Update its quantity instead.",
        variant: "destructive",
      });
      return;
    }

    setRfqItems([
      ...rfqItems,
      {
        materialId: material.id,
        materialName: material.nameEn,
        quantity: parseFloat(quantity),
        unit: material.unit || "unit",
      },
    ]);

    // Reset selection
    setSelectedMaterialId("");
    setQuantity("1");
    setSearchTerm("");

    toast({
      title: "Material Added",
      description: `${material.nameEn} added to RFQ`,
    });
  };

  const handleRemoveMaterial = (materialId: number) => {
    setRfqItems(rfqItems.filter((item) => item.materialId !== materialId));
  };

  const handleUpdateQuantity = (materialId: number, newQuantity: string) => {
    const qty = parseFloat(newQuantity);
    if (qty > 0) {
      setRfqItems(
        rfqItems.map((item) =>
          item.materialId === materialId ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => {
      // First, create/find client
      let finalClientId = clientId;
      
      if (!finalClientId) {
        const clientResponse = await apiRequest("/api/clients/register-or-find", {
          method: "POST",
          body: JSON.stringify({
            whatsapp,
            name: clientName,
            company: company || null,
          }),
        }) as Client;
        finalClientId = clientResponse.id;
      }

      // Then create RFQ
      return apiRequest("/api/rfqs", {
        method: "POST",
        body: JSON.stringify({
          clientId: finalClientId,
          projectName: data.projectName,
          items: data.items.map((item: RFQItem) => ({
            materialId: item.materialId,
            materialName: item.materialName,
            quantity: item.quantity,
            unit: item.unit,
          })),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "RFQ Created",
        description: "RFQ has been created successfully.",
      });
      
      setLocation("/admin/rfqs");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create RFQ",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!whatsapp || !clientName || !projectName || rfqItems.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one material.",
        variant: "destructive",
      });
      return;
    }

    // Validate WhatsApp format
    if (!whatsapp.match(/^\+252|^\+254/)) {
      toast({
        title: "Invalid WhatsApp",
        description: "WhatsApp number must start with +252 (Somalia) or +254 (Kenya)",
        variant: "destructive",
      });
      return;
    }

    createRFQMutation.mutate({
      projectName,
      items: rfqItems,
    });
  };

  if (isLoadingMaterials) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add RFQ</h1>
            <p className="text-muted-foreground mt-1">Create RFQ from phone call</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin/rfqs")} data-testid="button-cancel">
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Enter client details. If WhatsApp exists, info will auto-fill.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      placeholder="+252 or +254..."
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      onBlur={handleWhatsappBlur}
                      className="pl-9"
                      required
                      data-testid="input-whatsapp"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">
                    Client Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clientName"
                      placeholder="Full name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="pl-9"
                      required
                      data-testid="input-client-name"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      placeholder="Company name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-9"
                      data-testid="input-company"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectName">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Villa Construction"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    data-testid="input-project-name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Add Materials</CardTitle>
              <CardDescription>Search and add materials to this RFQ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category and Subcategory Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedSubcategory("all");
                    setSelectedMaterialId("");
                  }}>
                    <SelectTrigger id="category" data-testid="select-category">
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
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select 
                    value={selectedSubcategory} 
                    onValueChange={(value) => {
                      setSelectedSubcategory(value);
                      setSelectedMaterialId("");
                    }}
                    disabled={selectedCategory === "all" || subcategories.length === 0}
                  >
                    <SelectTrigger id="subcategory" data-testid="select-subcategory">
                      <SelectValue placeholder="All Subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcategories</SelectItem>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory!}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-materials"
                    />
                  </div>
                </div>
              </div>

              {/* Material Selection and Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="material">Select Material</Label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger id="material" data-testid="select-material">
                      <SelectValue placeholder="Choose material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMaterials.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No materials found. Try changing category or search.
                        </div>
                      ) : (
                        filteredMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.nameEn} 
                            {material.subcategory && ` - ${material.subcategory}`}
                            {` (${material.unit})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      data-testid="input-quantity"
                    />
                    <Button
                      type="button"
                      onClick={handleAddMaterial}
                      disabled={!selectedMaterialId}
                      data-testid="button-add-material-to-rfq"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* RFQ Items Table */}
              {rfqItems.length > 0 && (
                <div className="mt-6 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqItems.map((item) => (
                        <TableRow key={item.materialId}>
                          <TableCell className="font-medium">{item.materialName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.materialId, e.target.value)}
                              className="w-24"
                              data-testid={`input-quantity-${item.materialId}`}
                            />
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMaterial(item.materialId)}
                              data-testid={`button-remove-${item.materialId}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {rfqItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No materials added yet. Search and add materials above.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/rfqs")} data-testid="button-cancel-bottom">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRFQMutation.isPending || rfqItems.length === 0}
              data-testid="button-submit-rfq"
            >
              {createRFQMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create RFQ"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddRFQ;
