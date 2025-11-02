import { useState } from "react";
import { Plus, Edit, Trash2, Upload, Power, PowerOff, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
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

interface Material {
  id: number;
  nameEn: string;
  nameSo: string | null;
  description: string | null;
  descriptionSo: string | null;
  unit: string | null;
  unitSo: string | null;
  category: string;
  subcategory: string | null;
  imageUrl: string | null;
  active: boolean;
}

interface MaterialSupplier {
  id: number;
  materialId: number;
  supplierId: number;
  supplierPrice: string | null;
  supplierPosition: number;
  supplierName?: string;
  supplierCompany?: string;
}

interface Supplier {
  id: number;
  name: string;
  company?: string;
  status: string;
}

const MaterialManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [suppliersDialogOpen, setSuppliersDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const { toast} = useToast();

  const [formData, setFormData] = useState({
    nameEn: "",
    description: "",
    unit: "",
    category: "",
    subcategory: "",
    imageUrl: "",
    active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [supplierFormData, setSupplierFormData] = useState({
    supplierId: "",
    supplierPrice: "",
    supplierPosition: 1,
  });

  // Fetch materials from database
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Fetch all suppliers for the dropdown
  const { data: allSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: suppliersDialogOpen,
  });

  // Fetch material suppliers when dialog is open
  const { data: materialSuppliers = [], refetch: refetchMaterialSuppliers } = useQuery<MaterialSupplier[]>({
    queryKey: [`/api/materials/${selectedMaterialId}/suppliers`],
    enabled: !!selectedMaterialId && suppliersDialogOpen,
  });

  // Create/Update material mutation
  const saveMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingMaterial 
        ? `/api/materials/${editingMaterial.id}` 
        : "/api/materials";
      const method = editingMaterial ? "PATCH" : "POST";
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ 
        title: editingMaterial ? "Material Updated" : "Material Added",
        description: `${formData.nameEn} has been ${editingMaterial ? "updated" : "added"} successfully.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Operation Failed",
        description: error.message || "Failed to save material.",
        variant: "destructive",
      });
    },
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/materials/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ 
        title: "Material Deleted",
        description: "Material has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete material.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return await apiRequest(`/api/materials/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: variables.active ? "Material Activated" : "Material Deactivated",
        description: `Material is now ${variables.active ? "visible" : "hidden"} to clients.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update material status.",
        variant: "destructive",
      });
    },
  });

  // Add supplier to material
  const addSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/materials/${selectedMaterialId}/suppliers`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      refetchMaterialSuppliers();
      toast({
        title: "Supplier Added",
        description: "Supplier has been assigned to this material successfully.",
      });
      setSupplierFormData({ supplierId: "", supplierPrice: "", supplierPosition: 1 });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Supplier",
        description: error.message || "Could not assign supplier to material.",
        variant: "destructive",
      });
    },
  });

  // Remove supplier from material
  const removeSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/material-suppliers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      refetchMaterialSuppliers();
      toast({
        title: "Supplier Removed",
        description: "Supplier has been unassigned from this material.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Supplier",
        description: error.message || "Could not remove supplier from material.",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Cement",
    "Aggregate and Sand",
    "Steel",
    "Block",
    "Wood",
    "Interlock, Tiles etc",
    "Gypsum",
    "Chemical & Adhesives",
    "Tools & Consumables",
    "Insulation",
    "Electrical Material",
    "Plumbing",
  ];

  const subcategoriesByCategory: Record<string, string[]> = {
    "Cement": ["Cement Bags", "Concrete Ready Mix", "Bulk Cement", "Cement Board", "Concrete Products"],
    "Aggregate and Sand": ["Aggregate", "Sand"],
    "Steel": ["Steel Rebar", "Steel Products", "Industrial Steel (Commercial)"],
    "Block": ["Normal", "Wood"],
    "Wood": ["Block", "Plywood", "MDF Boards"],
    "Interlock, Tiles etc": ["Kerbstone", "Interlock", "Tiles"],
    "Gypsum": ["Gypsum Board", "Gypsum Bags", "Gypsum Accessories"],
    "Chemical & Adhesives": ["Chemicals / Pesticides", "Finishing Materials", "Paints"],
    "Tools & Consumables": ["Consumables", "Industrial Tools", "Safety Materials", "Electrical Tools"],
    "Insulation": ["Styrofoam", "Liquid Bitumen", "Filler Board", "Water Insulation", "Geotextile"],
    "Electrical Material": ["Cables and Wires", "Boxes and Cover", "Indoor Lighting", "Switches", "Sockets", "Control Panels", "Fans", "Cable Management System", "Electrical Accessories"],
    "Plumbing": ["Pipes", "Water Tank", "PVC & cPVC FITTINGS", "UPVC FITTINGS", "Water Pumps", "Manhole Covers"],
  };

  const units = ["pcs", "kg", "tons", "m", "m²", "m³", "liters", "bags", "boxes", "sq ft", "cu ft", "gallons"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameEn || !formData.category || !formData.unit) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: English name, category, and unit.",
        variant: "destructive",
      });
      return;
    }

    saveMaterialMutation.mutate(formData);
  };

  const deleteMaterial = (id: number) => {
    deleteMaterialMutation.mutate(id);
  };

  const toggleActive = (id: number, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, active: !currentStatus });
  };

  const editMaterial = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      nameEn: material.nameEn,
      description: material.description || "",
      unit: material.unit || "",
      category: material.category,
      subcategory: material.subcategory || "",
      imageUrl: material.imageUrl || "",
      active: material.active,
    });
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nameEn: "",
      description: "",
      unit: "",
      category: "",
      subcategory: "",
      imageUrl: "",
      active: true,
    });
    setImageFile(null);
    setEditingMaterial(null);
    setIsDialogOpen(false);
  };

  const openSuppliersDialog = (materialId: number) => {
    setSelectedMaterialId(materialId);
    setSuppliersDialogOpen(true);
  };

  const closeSuppliersDialog = () => {
    setSuppliersDialogOpen(false);
    setSelectedMaterialId(null);
    setSupplierFormData({ supplierId: "", supplierPrice: "", supplierPosition: 1 });
  };

  const handleAddSupplier = () => {
    if (!supplierFormData.supplierId) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier.",
        variant: "destructive",
      });
      return;
    }

    if (materialSuppliers.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "A material can have a maximum of 5 suppliers.",
        variant: "destructive",
      });
      return;
    }

    addSupplierMutation.mutate({
      materialId: selectedMaterialId,
      supplierId: parseInt(supplierFormData.supplierId),
      supplierPrice: supplierFormData.supplierPrice || null,
      supplierPosition: supplierFormData.supplierPosition,
    });
  };

  const handleRemoveSupplier = (id: number) => {
    removeSupplierMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="section-container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading materials...</p>
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
              <CardTitle>Materials Management</CardTitle>
              <CardDescription className="mt-1">
                Manage construction materials with international units and categories.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} data-testid="button-add-material">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Edit Material" : "Add New Material"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in material details with international units.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Material Name */}
                  <div>
                    <Label htmlFor="nameEn">
                      Material Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="e.g., Portland Cement"
                      required
                      data-testid="input-name-en"
                    />
                  </div>

                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
                      >
                        <SelectTrigger id="category" data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                        disabled={!formData.category}
                      >
                        <SelectTrigger id="subcategory" data-testid="select-subcategory">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.category && subcategoriesByCategory[formData.category]?.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Unit */}
                  <div>
                    <Label htmlFor="unit">
                      Unit <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger id="unit" data-testid="select-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the material"
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="imageFile">
                      Material Image
                      <span className="text-muted-foreground text-xs ml-2">(Upload from computer)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            // Create preview URL
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-image-file"
                      />
                    </div>
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="active" className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.active ? "Material is visible to clients" : "Material is hidden from clients"}
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      data-testid="switch-active"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveMaterialMutation.isPending} data-testid="button-save-material">
                      {saveMaterialMutation.isPending ? "Saving..." : editingMaterial ? "Update Material" : "Add Material"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No materials found. Add your first material to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Material Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Suppliers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                        <TableCell>
                          {material.imageUrl ? (
                            <img
                              src={material.imageUrl}
                              alt={material.nameEn}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/48?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-name-en-${material.id}`}>
                          {material.nameEn}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{material.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {material.subcategory || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {material.unit}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSuppliersDialog(material.id)}
                            data-testid={`button-manage-suppliers-${material.id}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Suppliers
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={material.active ? "default" : "secondary"}
                            onClick={() => toggleActive(material.id, material.active)}
                            className="w-24"
                            data-testid={`button-toggle-${material.id}`}
                          >
                            {material.active ? (
                              <>
                                <Power className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editMaterial(material)}
                              data-testid={`button-edit-${material.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  data-testid={`button-delete-${material.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Material?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete {material.nameEn}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMaterial(material.id)}>
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

        {/* Supplier Management Dialog */}
        <Dialog open={suppliersDialogOpen} onOpenChange={closeSuppliersDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Suppliers</DialogTitle>
              <DialogDescription>
                Assign up to 5 suppliers to this material with their pricing. Clients will see them as Supplier 1-5.
              </DialogDescription>
            </DialogHeader>

            {/* Assigned Suppliers List */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Assigned Suppliers ({materialSuppliers.length}/5)</h3>
                {materialSuppliers.length === 0 ? (
                  <div className="text-center py-6 border rounded-lg bg-muted/20">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No suppliers assigned yet. Add suppliers below.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materialSuppliers.map((ms) => (
                      <div
                        key={ms.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`material-supplier-${ms.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Position {ms.supplierPosition}</Badge>
                          <div>
                            <div className="font-medium">{ms.supplierName || `Supplier ID: ${ms.supplierId}`}</div>
                            {ms.supplierCompany && (
                              <div className="text-sm text-muted-foreground">{ms.supplierCompany}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {ms.supplierPrice && (
                            <div className="text-sm font-medium">${ms.supplierPrice}</div>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveSupplier(ms.id)}
                            data-testid={`button-remove-supplier-${ms.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Supplier Form */}
              {materialSuppliers.length < 5 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Add New Supplier</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="supplier-select">Supplier</Label>
                      <Select
                        value={supplierFormData.supplierId}
                        onValueChange={(value) =>
                          setSupplierFormData({ ...supplierFormData, supplierId: value })
                        }
                      >
                        <SelectTrigger id="supplier-select" data-testid="select-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSuppliers
                            .filter((s) => s.status === "active")
                            .filter((s) => !materialSuppliers.some((ms) => ms.supplierId === s.id))
                            .map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name} {supplier.company && `(${supplier.company})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="position-select">Position</Label>
                      <Select
                        value={supplierFormData.supplierPosition.toString()}
                        onValueChange={(value) =>
                          setSupplierFormData({ ...supplierFormData, supplierPosition: parseInt(value) })
                        }
                      >
                        <SelectTrigger id="position-select" data-testid="select-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((pos) => (
                            <SelectItem key={pos} value={pos.toString()}>
                              Position {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label htmlFor="supplier-price">Supplier Price (Optional)</Label>
                      <Input
                        id="supplier-price"
                        type="number"
                        step="0.01"
                        value={supplierFormData.supplierPrice}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, supplierPrice: e.target.value })
                        }
                        placeholder="0.00"
                        data-testid="input-supplier-price"
                      />
                    </div>

                    <div className="col-span-3">
                      <Button
                        onClick={handleAddSupplier}
                        disabled={addSupplierMutation.isPending}
                        className="w-full"
                        data-testid="button-add-supplier-to-material"
                      >
                        {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeSuppliersDialog}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default MaterialManagement;
