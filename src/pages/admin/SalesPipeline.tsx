import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreVertical, Phone, MapPin, Package, Trash2, Edit, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lead } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Pipeline stages configuration
const PIPELINE_STAGES = [
  { id: "new_request", name: "🟢 New Requests", color: "bg-green-100 dark:bg-green-900/30 border-green-500" },
  { id: "rfq_sent", name: "🟡 RFQ Sent", color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500" },
  { id: "quotes_received", name: "🟠 Quotes Received", color: "bg-orange-100 dark:bg-orange-900/30 border-orange-500" },
  { id: "contractor_review", name: "🔵 Contractor Review", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-500" },
  { id: "in_delivery", name: "🟣 In Delivery", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-500" },
  { id: "completed", name: "🔴 Completed", color: "bg-red-100 dark:bg-red-900/30 border-red-500" },
];

// Draggable Lead Card Component
function LeadCard({ lead, onEdit, onDelete }: { lead: Lead; onEdit: (lead: Lead) => void; onDelete: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 cursor-move" {...listeners}>
              <h4 className="font-semibold text-sm">
                {lead.contractorName || "Client"} - {lead.projectName || "Project"}
              </h4>
              {lead.projectName && lead.contractorName && (
                <p className="text-xs text-muted-foreground">{lead.projectName}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {lead.contractorWhatsapp && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {lead.contractorWhatsapp}
            </div>
          )}

          {lead.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {lead.location}
            </div>
          )}

          {lead.materials && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              {(() => {
                try {
                  const materials = JSON.parse(lead.materials);
                  return `${materials.length} item${materials.length !== 1 ? 's' : ''}`;
                } catch {
                  return 'Materials listed';
                }
              })()}
            </div>
          )}

          {lead.estimatedValue && (
            <div className="text-xs font-medium text-primary">
              ${parseFloat(lead.estimatedValue).toFixed(2)}
            </div>
          )}

          <div className="flex gap-1 flex-wrap items-center">
            <Badge variant="outline" className="text-xs">
              {lead.leadSource === "from_rfq" ? "From RFQ" : "Manual"}
            </Badge>
            {lead.rfqId && (
              <>
                <Badge variant="secondary" className="text-xs">
                  RFQ #{lead.rfqId}
                </Badge>
                <Link href="/admin/rfqs" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View RFQ
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Pipeline Column Component
function PipelineColumn({
  stage,
  leads,
  onEdit,
  onDelete,
}: {
  stage: { id: string; name: string; color: string };
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <Card className={`border-2 ${stage.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{stage.name}</span>
            <Badge variant="secondary">{leads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </SortableContext>
          {leads.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No leads in this stage
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesPipeline() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form state for adding/editing leads
  const [formData, setFormData] = useState({
    contractorName: "",
    contractorWhatsapp: "",
    projectName: "",
    location: "",
    materials: "",
    estimatedValue: "",
    notes: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch all leads
  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Show ALL leads (RFQ-based and manual, all stages including completed)
  const leads = allLeads;

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead Created", description: "New lead added successfully." });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  // Update lead mutation (for stage changes and edits)
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingLead(null);
      resetForm();
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/leads/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead Deleted", description: "Lead removed successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      contractorName: "",
      contractorWhatsapp: "",
      projectName: "",
      location: "",
      materials: "",
      estimatedValue: "",
      notes: "",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeLead = leads.find((l) => l.id === active.id);
    const overLead = leads.find((l) => l.id === over.id);

    if (!activeLead || !overLead) return;

    // If dropped on a different stage, update the lead's stage
    if (activeLead.stage !== overLead.stage) {
      updateLeadMutation.mutate({
        id: activeLead.id,
        data: { stage: overLead.stage },
      });
      toast({
        title: "Lead Moved",
        description: `Moved to ${PIPELINE_STAGES.find(s => s.id === overLead.stage)?.name}`,
      });
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    
    // Parse materials JSON to display as comma-separated text
    let materialsText = "";
    if (lead.materials) {
      try {
        const materialsArray = JSON.parse(lead.materials);
        materialsText = materialsArray.join(", ");
      } catch {
        materialsText = lead.materials;
      }
    }
    
    setFormData({
      contractorName: lead.contractorName || "",
      contractorWhatsapp: lead.contractorWhatsapp || "",
      projectName: lead.projectName || "",
      location: lead.location || "",
      materials: materialsText,
      estimatedValue: lead.estimatedValue?.toString() || "",
      notes: lead.notes || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse materials from comma-separated text to JSON array
    let materialsJson = null;
    if (formData.materials) {
      const materialsArray = formData.materials
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);
      materialsJson = JSON.stringify(materialsArray);
    }

    const leadData = {
      contractorName: formData.contractorName,
      contractorWhatsapp: formData.contractorWhatsapp,
      projectName: formData.projectName,
      location: formData.location || null,
      materials: materialsJson,
      estimatedValue: formData.estimatedValue || null,
      notes: formData.notes || null,
    };

    if (editingLead) {
      // When editing, don't change leadSource or stage - only update provided fields
      updateLeadMutation.mutate({ id: editingLead.id, data: leadData });
    } else {
      // When creating new, set defaults
      createLeadMutation.mutate({
        ...leadData,
        leadSource: "manual",
        stage: "new_request",
      });
    }
  };

  // Group leads by stage
  const leadsByStage = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage === stage.id),
  }));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading pipeline...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="section-container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Sales Pipeline</h1>
            <p className="text-muted-foreground mt-1">Track leads through your sales process</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-lead">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Kanban Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {leadsByStage.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                leads={stage.leads}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DndContext>

        {/* Add/Edit Lead Dialog */}
        <Dialog open={addDialogOpen || !!editingLead} onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditingLead(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
              <DialogDescription>
                {editingLead ? "Update lead information" : "Create a new lead manually"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractorName">Contractor Name *</Label>
                  <Input
                    id="contractorName"
                    value={formData.contractorName}
                    onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                    placeholder="John Doe Construction"
                    required
                    data-testid="input-contractor-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractorWhatsapp">WhatsApp Number</Label>
                  <Input
                    id="contractorWhatsapp"
                    value={formData.contractorWhatsapp}
                    onChange={(e) => setFormData({ ...formData, contractorWhatsapp: e.target.value })}
                    placeholder="+252615401195"
                    data-testid="input-contractor-whatsapp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="New Office Building"
                  required
                  data-testid="input-project-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Mogadishu, Somalia"
                  data-testid="input-location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials">Materials Needed</Label>
                <Textarea
                  id="materials"
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  placeholder="Enter materials separated by commas (e.g., Cement, Steel bars, Sand, Gravel)"
                  rows={3}
                  data-testid="input-materials"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple materials with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  placeholder="10000.00"
                  data-testid="input-estimated-value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLeadMutation.isPending || updateLeadMutation.isPending}
                  data-testid="button-save-lead"
                >
                  {createLeadMutation.isPending || updateLeadMutation.isPending
                    ? "Saving..."
                    : editingLead
                    ? "Update Lead"
                    : "Create Lead"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
