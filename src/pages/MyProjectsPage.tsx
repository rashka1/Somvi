import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderKanban, MapPin, Calendar, FileText, Plus, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import type { Project, ProjectPhase, RFQ } from "@shared/schema";

export default function MyProjectsPage() {
  const [, setLocation] = useLocation();
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects", clientWhatsapp],
    enabled: !!clientWhatsapp,
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

  const { data: projectRfqs = [] } = useQuery<RFQ[]>({
    queryKey: ["/api/projects", viewingProject?.id, "rfqs"],
    enabled: !!viewingProject,
    queryFn: async () => {
      if (!viewingProject) return [];
      const response = await fetch(`/api/projects/${viewingProject.id}/rfqs`);
      if (!response.ok) throw new Error("Failed to fetch RFQs");
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger query with whatsapp number
  };

  const handleRequestMaterials = (project: Project) => {
    // Store project info to prefill RFQ form
    sessionStorage.setItem('selectedProject', JSON.stringify({
      projectId: project.id,
      projectName: project.name,
      district: project.district,
    }));
    setLocation("/platform");
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planning: "secondary",
      active: "default",
      completed: "outline",
      on_hold: "destructive",
    };
    return variants[status] || "default";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="section-container py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FolderKanban className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">My Projects</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Track your construction projects, phases, and material requests
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Find Your Projects</CardTitle>
                <CardDescription>
                  Enter your WhatsApp number to view your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-4">
                  <Input
                    type="tel"
                    placeholder="+252 or +254..."
                    value={clientWhatsapp}
                    onChange={(e) => setClientWhatsapp(e.target.value)}
                    className="flex-1"
                    data-testid="input-whatsapp-search"
                  />
                  <Button type="submit" data-testid="button-search-projects">
                    Search Projects
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Projects List */}
            {clientWhatsapp && (
              <>
                {loadingProjects ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
                      <p className="text-muted-foreground mb-6">
                        No projects associated with this WhatsApp number.
                      </p>
                      <Button onClick={() => setLocation("/platform")} data-testid="button-start-rfq">
                        <Plus className="w-4 h-4 mr-2" />
                        Start New RFQ
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {projects.map((project) => (
                      <Card key={project.id} data-testid={`card-project-${project.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-2xl" data-testid={`text-project-name-${project.id}`}>
                                  {project.name}
                                </CardTitle>
                                <Badge variant={getStatusVariant(project.status)}>
                                  {project.status.replace("_", " ")}
                                </Badge>
                              </div>
                              {project.district && (
                                <div className="flex items-center text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {project.district}
                                </div>
                              )}
                              <CardDescription>
                                Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {project.notes && (
                            <p className="text-sm text-muted-foreground">{project.notes}</p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setViewingProject(project)}
                              data-testid={`button-view-project-${project.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              onClick={() => handleRequestMaterials(project)}
                              data-testid={`button-request-materials-${project.id}`}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Request Additional Materials
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Project Details Dialog */}
      <Dialog open={!!viewingProject} onOpenChange={(open) => !open && setViewingProject(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProject?.name}</DialogTitle>
            <DialogDescription>
              Project details, phases, and linked RFQs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="phases" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="rfqs">RFQs</TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="space-y-4">
              {phases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No phases defined yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phases.map((phase) => (
                      <TableRow key={phase.id}>
                        <TableCell className="font-medium">{phase.phaseName}</TableCell>
                        <TableCell>
                          {phase.phaseDate ? format(new Date(phase.phaseDate), "MMM d, yyyy") : "Not set"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={phase.completed ? "outline" : "secondary"}>
                            {phase.completed ? "Completed" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="rfqs" className="space-y-4">
              {projectRfqs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No RFQs linked to this project</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ Number</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectRfqs.map((rfq) => (
                      <TableRow key={rfq.id}>
                        <TableCell className="font-medium">{rfq.rfqNumber}</TableCell>
                        <TableCell>{rfq.projectName}</TableCell>
                        <TableCell>
                          <Badge>{rfq.status}</Badge>
                        </TableCell>
                        <TableCell>${rfq.totalAmount || "0.00"}</TableCell>
                        <TableCell>{format(new Date(rfq.createdAt), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
