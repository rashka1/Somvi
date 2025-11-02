import { useLocation } from "wouter";
import { FileText, CheckCircle, DollarSign, Users, Clock, Plus, Package, Send, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import type { RFQ } from "@shared/schema";

const Dashboard = () => {
  const [, setLocation] = useLocation();

  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics"],
  });

  const { data: rfqs = [], isLoading: isLoadingRFQs } = useQuery<RFQ[]>({
    queryKey: ["/api/rfqs"],
  });

  const getStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return "bg-yellow-500";
      case "quoted":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-8">
        {/* Quick Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={() => setLocation("/admin/suppliers")}
            data-testid="button-add-supplier"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
          <Button 
            onClick={() => setLocation("/admin/materials")}
            variant="outline"
            data-testid="button-add-material"
          >
            <Package className="w-4 h-4 mr-2" />
            Add Material
          </Button>
          <Button 
            onClick={() => setLocation("/admin/rfqs/new")}
            variant="outline"
            data-testid="button-add-rfq"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Add RFQ
          </Button>
          <Button 
            onClick={() => setLocation("/admin/rfqs")}
            variant="outline"
            data-testid="button-send-quotation"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Quotation
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card data-testid="card-total-clients">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clients">
                {isLoadingStats ? "..." : statistics?.totalClients || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-rfqs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-rfqs">
                {isLoadingStats ? "..." : statistics?.totalRFQs || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics?.pendingQuotes || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-quotes">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-quotes">
                {isLoadingStats ? "..." : statistics?.pendingQuotes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-completed-orders">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-orders">
                {isLoadingStats ? "..." : statistics?.completedOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-profit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-profit">
                ${isLoadingStats ? "..." : (parseFloat(statistics?.totalProfit || "0")).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From completed orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly RFQs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly RFQs & Approved Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading chart data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics?.monthlyRFQs || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total RFQs" />
                  <Bar dataKey="approved" fill="hsl(var(--accent))" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent RFQs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent RFQs</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/admin/rfqs")}
              data-testid="button-view-all-rfqs"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRFQs ? (
              <p className="text-muted-foreground text-center py-8">Loading RFQs...</p>
            ) : rfqs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No RFQs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfqs.slice(0, 5).map((rfq) => (
                    <TableRow 
                      key={rfq.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/admin/rfqs`)}
                      data-testid={`row-rfq-${rfq.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-rfq-number-${rfq.id}`}>
                        {rfq.rfqNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rfq.clientName}</p>
                          {rfq.clientCompany && (
                            <p className="text-xs text-muted-foreground">{rfq.clientCompany}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{rfq.projectName || "-"}</TableCell>
                      <TableCell>{new Date(rfq.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rfq.status)} data-testid={`badge-status-${rfq.id}`}>
                          {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
