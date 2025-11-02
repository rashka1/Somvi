import { useState } from "react";
import { Plus, Edit, Trash2, Building2, Star, Phone, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Supplier } from "@shared/schema";

const SupplierManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    contact: "",
    whatsapp: "",
    email: "",
    category: "",
    status: "active",
    rating: 5,
  });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const saveSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ 
        title: editingSupplier ? "Supplier Updated" : "Supplier Added",
        description: `${formData.name} has been ${editingSupplier ? "updated" : "added"} successfully.`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Operation Failed",
        description: error.message || "Failed to save supplier.",
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ 
        title: "Supplier Deleted",
        description: "Supplier has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete supplier.",
        variant: "destructive",
      });
    },
  });

  const categories = [
    "Cement & Concrete",
    "Steel & Metal",
    "Aggregates & Sand",
    "Finishing Materials",
    "Plumbing & Electrical",
    "Tools & Equipment",
    "Paint & Coating",
    "Timber & Wood",
    "General",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
        variant: "destructive",
      });
      return;
    }

    saveSupplierMutation.mutate(formData);
  };

  const deleteSupplier = (id: number) => {
    deleteSupplierMutation.mutate(id);
  };

  const editSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      company: supplier.company || "",
      contact: supplier.contact || "",
      whatsapp: supplier.whatsapp || "",
      email: supplier.email || "",
      category: supplier.category || "",
      status: supplier.status || "active",
      rating: supplier.rating || 5,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      contact: "",
      whatsapp: "",
      email: "",
      category: "",
      status: "active",
      rating: 5,
    });
    setEditingSupplier(null);
    setIsDialogOpen(false);
  };

  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating}/5)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="section-container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading suppliers...</p>
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
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription className="mt-1">
                Manage supplier relationships and assign them to materials. Up to 5 suppliers per material.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} data-testid="button-add-supplier">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                  </DialogTitle>
                  <DialogDescription>
                    Enter supplier details. These suppliers can be assigned to materials with specific pricing.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Supplier Name */}
                  <div>
                    <Label htmlFor="name">
                      Supplier Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., ABC Construction Supplies"
                      required
                      data-testid="input-supplier-name"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., ABC Ltd."
                      data-testid="input-supplier-company"
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="e.g., Mohamed Ahmed"
                      data-testid="input-supplier-contact"
                    />
                  </div>

                  {/* WhatsApp & Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+252..."
                        data-testid="input-supplier-whatsapp"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="supplier@example.com"
                        data-testid="input-supplier-email"
                      />
                    </div>
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category" data-testid="select-supplier-category">
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
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="status" data-testid="select-supplier-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Select 
                      value={formData.rating.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                    >
                      <SelectTrigger id="rating" data-testid="select-supplier-rating">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ (Excellent)</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ (Good)</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ (Average)</SelectItem>
                        <SelectItem value="2">⭐⭐ (Below Average)</SelectItem>
                        <SelectItem value="1">⭐ (Poor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveSupplierMutation.isPending} data-testid="button-submit-supplier">
                      {saveSupplierMutation.isPending ? "Saving..." : editingSupplier ? "Update Supplier" : "Add Supplier"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No Suppliers Yet</p>
                <p className="text-muted-foreground mb-4">Add suppliers to start assigning them to materials with pricing.</p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-supplier">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Supplier
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                              {supplier.name}
                            </div>
                            {supplier.contact && (
                              <div className="text-sm text-muted-foreground">
                                {supplier.contact}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.company ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{supplier.company}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {supplier.whatsapp && (
                              <div className="flex items-center gap-2 text-sm">
                                <MessageSquare className="w-3 h-3 text-green-600" />
                                <span>{supplier.whatsapp}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-blue-600" />
                                <span>{supplier.email}</span>
                              </div>
                            )}
                            {!supplier.whatsapp && !supplier.email && (
                              <span className="text-muted-foreground text-sm">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.category ? (
                            <Badge variant="secondary">{supplier.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <RatingStars rating={supplier.rating || 5} />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={supplier.status === "active" ? "default" : "secondary"}
                            data-testid={`badge-supplier-status-${supplier.id}`}
                          >
                            {supplier.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editSupplier(supplier)}
                              data-testid={`button-edit-supplier-${supplier.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  data-testid={`button-delete-supplier-${supplier.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete {supplier.name} and remove all material assignments.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSupplier(supplier.id)}>
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
      </div>
    </AdminLayout>
  );
};

export default SupplierManagement;
