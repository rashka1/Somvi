import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDealSchema, type Deal, type Material, type Supplier } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { MOGADISHU_DISTRICTS } from "@shared/schema";
import AdminLayout from "@/components/admin/AdminLayout";

const dealFormSchema = insertDealSchema.extend({
  validFrom: z.string(),
  validTo: z.string(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

export default function Deals() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const { toast } = useToast();

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      materialId: 0,
      discount: 0,
      validFrom: "",
      validTo: "",
      district: "",
      supplierId: null,
      status: "active",
      broadcast: false,
      description: "",
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      return await apiRequest("/api/deals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Deal created successfully" });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DealFormData> }) => {
      return await apiRequest(`/api/deals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setEditingDeal(null);
      form.reset();
      toast({ title: "Deal updated successfully" });
    },
  });

  const toggleBroadcastMutation = useMutation({
    mutationFn: async ({ id, broadcast }: { id: number; broadcast: boolean }) => {
      return await apiRequest(`/api/deals/${id}/broadcast`, {
        method: "PATCH",
        body: JSON.stringify({ broadcast }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "Broadcast status updated" });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/deals/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({ title: "Deal deleted successfully" });
    },
  });

  const handleOpenAddDialog = () => {
    form.reset({
      title: "",
      materialId: 0,
      discount: 0,
      validFrom: "",
      validTo: "",
      district: "",
      supplierId: null,
      status: "active",
      broadcast: false,
      description: "",
    });
    setEditingDeal(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (deal: Deal) => {
    form.reset({
      title: deal.title,
      materialId: deal.materialId || 0,
      discount: deal.discount,
      validFrom: deal.validFrom ? format(new Date(deal.validFrom), "yyyy-MM-dd") : "",
      validTo: deal.validTo ? format(new Date(deal.validTo), "yyyy-MM-dd") : "",
      district: deal.district || "",
      supplierId: deal.supplierId || null,
      status: deal.status,
      broadcast: deal.broadcast,
      description: deal.description || "",
    });
    setEditingDeal(deal);
    setIsAddDialogOpen(true);
  };

  const onSubmit = (data: DealFormData) => {
    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, data });
    } else {
      createDealMutation.mutate(data);
    }
  };

  const now = new Date();
  const activeDeals = deals.filter(
    (d) =>
      d.status === "active" &&
      new Date(d.validFrom) <= now &&
      new Date(d.validTo) >= now
  );
  const expiredDeals = deals.filter(
    (d) => d.status === "active" && new Date(d.validTo) < now
  );
  const hiddenDeals = deals.filter((d) => d.status === "hidden");

  const renderDealsTable = (dealsToRender: Deal[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Valid Period</TableHead>
          <TableHead>District</TableHead>
          <TableHead>Broadcast</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dealsToRender.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground">
              No deals found
            </TableCell>
          </TableRow>
        ) : (
          dealsToRender.map((deal) => {
            const material = materials.find((m) => m.id === deal.materialId);
            return (
              <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                <TableCell data-testid={`text-deal-title-${deal.id}`}>{deal.title}</TableCell>
                <TableCell>{material?.name || "All Materials"}</TableCell>
                <TableCell>{deal.discount}%</TableCell>
                <TableCell>
                  {format(new Date(deal.validFrom), "MMM d, yyyy")} -{" "}
                  {format(new Date(deal.validTo), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{deal.district || "All Districts"}</TableCell>
                <TableCell>
                  <Switch
                    checked={deal.broadcast}
                    onCheckedChange={(checked) =>
                      toggleBroadcastMutation.mutate({ id: deal.id, broadcast: checked })
                    }
                    data-testid={`switch-broadcast-${deal.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={deal.status === "active" ? "default" : "secondary"}>
                    {deal.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(deal)}
                      data-testid={`button-edit-deal-${deal.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this deal?")) {
                          deleteDealMutation.mutate(deal.id);
                        }
                      }}
                      data-testid={`button-delete-deal-${deal.id}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deals Management</h2>
          <p className="text-muted-foreground">
            Create and manage promotional deals for materials
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} data-testid="button-add-deal">
          <Plus className="mr-2 h-4 w-4" /> Add Deal
        </Button>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>All Deals</CardTitle>
          <CardDescription>
            View and manage all promotional deals. Use broadcast to show deals on client catalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active" data-testid="tab-active-deals">
                Active ({activeDeals.length})
              </TabsTrigger>
              <TabsTrigger value="expired" data-testid="tab-expired-deals">
                Expired ({expiredDeals.length})
              </TabsTrigger>
              <TabsTrigger value="hidden" data-testid="tab-hidden-deals">
                Hidden ({hiddenDeals.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {renderDealsTable(activeDeals)}
            </TabsContent>
            <TabsContent value="expired">
              {renderDealsTable(expiredDeals)}
            </TabsContent>
            <TabsContent value="hidden">
              {renderDealsTable(hiddenDeals)}
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-deal">
              {editingDeal ? "Edit Deal" : "Add New Deal"}
            </DialogTitle>
            <DialogDescription>
              {editingDeal
                ? "Update the deal information"
                : "Create a new promotional deal for materials"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Summer Sale on Cement" data-testid="input-deal-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || "0"}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-material">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">All Materials</SelectItem>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id.toString()}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Leave as "All Materials" for site-wide deals</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-deal-discount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-deal-validfrom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-deal-validto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District (Optional)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-district">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Districts</SelectItem>
                          {MOGADISHU_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Leave empty for all districts</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Suppliers</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Specific supplier for this deal</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-deal-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="broadcast"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Broadcast to Clients</FormLabel>
                        <FormDescription>
                          Show this deal on the client catalog page
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-deal-broadcast"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the deal details..."
                          data-testid="input-deal-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-deal"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDealMutation.isPending || updateDealMutation.isPending}
                  data-testid="button-submit-deal"
                >
                  {editingDeal ? "Update Deal" : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
