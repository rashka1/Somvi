import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertProjectPhaseSchema, type Project, type Client, type ProjectPhase } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MOGADISHU_DISTRICTS } from "@shared/schema";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";

const projectFormSchema = insertProjectSchema;
type ProjectFormData = z.infer<typeof projectFormSchema>;

const phaseFormSchema = insertProjectPhaseSchema.extend({
  phaseDate: z.string(),
});
type PhaseFormData = z.infer<typeof phaseFormSchema>;

export default function Projects() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: phases = [] } = useQuery<ProjectPhase[]>({
    queryKey: ["/api/projects", viewingProject?.id, "phases"],
    enabled: !!viewingProject,
    queryFn: async () => {
      if (!viewingProject) return [];
      const response = await fetch(`/api/projects/${viewingProject.id}/phases`);
      if (!response.ok) throw new Error("Failed to fetch phases");
      return response.json();
    },
  });

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      clientId: 0,
      district: "",
      status: "planning",
      notes: "",
    },
  });

  const phaseForm = useForm<PhaseFormData>({
    resolver: zodResolver(phaseFormSchema),
    defaultValues: {
      projectId: 0,
      phaseName: "",
      phaseDate: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsAddDialogOpen(false);
      projectForm.reset();
      toast({ title: "Project created successfully" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectFormData> }) => {
      return await apiRequest(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingProject(null);
      setIsAddDialogOpen(false);
      projectForm.reset();
      toast({ title: "Project updated successfully" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/projects/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted successfully" });
    },
  });

  const createPhaseMutation = useMutation({
    mutationFn: async (data: PhaseFormData) => {
      return await apiRequest(`/api/projects/${data.projectId}/phases`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", viewingProject?.id, "phases"] });
      setIsPhaseDialogOpen(false);
      phaseForm.reset();
      toast({ title: "Phase added successfully" });
    },
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/project-phases/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", viewingProject?.id, "phases"] });
      toast({ title: "Phase deleted successfully" });
    },
  });

  const handleOpenAddDialog = () => {
    projectForm.reset({
      name: "",
      clientId: 0,
      district: "",
      status: "planning",
      notes: "",
    });
    setEditingProject(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (project: Project) => {
    projectForm.reset({
      name: project.name,
      clientId: project.clientId,
      district: project.district || "",
      status: project.status,
      notes: project.notes || "",
    });
    setEditingProject(project);
    setIsAddDialogOpen(true);
  };

  const handleOpenPhaseDialog = () => {
    if (!viewingProject) return;
    phaseForm.reset({
      projectId: viewingProject.id,
      phaseName: "",
      phaseDate: "",
    });
    setIsPhaseDialogOpen(true);
  };

  const onSubmitProject = (data: ProjectFormData) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const onSubmitPhase = (data: PhaseFormData) => {
    createPhaseMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      planning: "secondary",
      active: "default",
      completed: "outline",
      on_hold: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

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
          <h2 className="text-3xl font-bold tracking-tight">Projects Management</h2>
          <p className="text-muted-foreground">
            Create and manage custom projects, link RFQs, and track phases
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} data-testid="button-add-project">
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            View and manage all custom projects with phases and linked RFQs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const client = clients.find((c) => c.id === project.clientId);
                  return (
                    <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                      <TableCell data-testid={`text-project-name-${project.id}`}>
                        {project.name}
                      </TableCell>
                      <TableCell>{client?.name || "Unknown"}</TableCell>
                      <TableCell>{project.district || "-"}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>{format(new Date(project.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingProject(project)}
                            data-testid={`button-view-project-${project.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(project)}
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this project?")) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                            data-testid={`button-delete-project-${project.id}`}
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
        </CardContent>
        </Card>

        {/* Add/Edit Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-project">
              {editingProject ? "Edit Project" : "Add New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project information"
                : "Create a new custom project for a client"}
            </DialogDescription>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Villa Construction - Phase 1" data-testid="input-project-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-project-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={projectForm.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-district">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          {MOGADISHU_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={projectForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={projectForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add project details, requirements, or notes..."
                        data-testid="input-project-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-project"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  data-testid="button-submit-project"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog with Phases */}
      <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-project-view">
              {viewingProject?.name}
            </DialogTitle>
            <DialogDescription>
              Project phases and timeline
            </DialogDescription>
          </DialogHeader>
          
          {viewingProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {clients.find((c) => c.id === viewingProject.clientId)?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{viewingProject.district || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(viewingProject.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(viewingProject.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {viewingProject.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{viewingProject.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Project Phases</h3>
                  <Button
                    size="sm"
                    onClick={handleOpenPhaseDialog}
                    data-testid="button-add-phase"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Phase
                  </Button>
                </div>

                {phases.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No phases added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {phases.map((phase) => (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`phase-item-${phase.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{phase.phaseName}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(phase.phaseDate), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this phase?")) {
                              deletePhaseMutation.mutate(phase.id);
                            }
                          }}
                          data-testid={`button-delete-phase-${phase.id}`}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingProject(null)}
              data-testid="button-close-project-view"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Phase Dialog */}
      <Dialog open={isPhaseDialogOpen} onOpenChange={setIsPhaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-phase">Add Project Phase</DialogTitle>
            <DialogDescription>Add a new phase to this project</DialogDescription>
          </DialogHeader>
          <Form {...phaseForm}>
            <form onSubmit={phaseForm.handleSubmit(onSubmitPhase)} className="space-y-4">
              <FormField
                control={phaseForm.control}
                name="phaseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phase Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Foundation Work" data-testid="input-phase-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={phaseForm.control}
                name="phaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phase Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-phase-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPhaseDialogOpen(false)}
                  data-testid="button-cancel-phase"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPhaseMutation.isPending}
                  data-testid="button-submit-phase"
                >
                  Add Phase
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
