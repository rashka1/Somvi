import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ReportData {
  rfqId: string;
  clientName: string;
  date: string;
  status: string;
  totalValue: number;
  profit: number;
  material: string;
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "all",
    client: "",
    material: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    
    const data: ReportData[] = [];
    storedRFQs.forEach((rfq: any) => {
      rfq.items?.forEach((item: any) => {
        let totalValue = 0;
        let profit = 0;

        if (item.suppliers) {
          Object.values(item.suppliers).forEach((supplier: any) => {
            const basePrice = supplier.basePrice || 0;
            const markup = supplier.markup || 0;
            const qty = item.quantity || 0;

            totalValue += (basePrice + markup) * qty;
            profit += markup * qty;
          });
        }

        data.push({
          rfqId: rfq.id,
          clientName: rfq.client.name,
          date: rfq.date,
          status: rfq.status,
          totalValue,
          profit,
          material: item.name,
        });
      });
    });

    setReportData(data);
  }, []);

  const filteredData = reportData.filter((item) => {
    if (filters.dateFrom && new Date(item.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(item.date) > new Date(filters.dateTo)) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.client && !item.clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
    if (filters.material && !item.material.toLowerCase().includes(filters.material.toLowerCase())) return false;
    return true;
  });

  const exportToExcel = () => {
    const data = [
      ["SOMVI Reports"],
      [""],
      ["RFQ ID", "Client", "Date", "Status", "Material", "Total Value", "Profit"],
      ...filteredData.map((item) => [
        item.rfqId,
        item.clientName,
        new Date(item.date).toLocaleDateString(),
        item.status,
        item.material,
        item.totalValue.toFixed(2),
        item.profit.toFixed(2),
      ]),
      [""],
      ["Summary"],
      ["Total Records", filteredData.length],
      ["Total Value", filteredData.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)],
      ["Total Profit", filteredData.reduce((sum, item) => sum + item.profit, 0).toFixed(2)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `SOMVI_Report_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({ title: "Report exported to Excel" });
  };

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client Name</Label>
                <Input
                  placeholder="Search client..."
                  value={filters.client}
                  onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                />
              </div>
              <div>
                <Label>Material</Label>
                <Input
                  placeholder="Search material..."
                  value={filters.material}
                  onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Report Data ({filteredData.length} records)</CardTitle>
            <Button onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No data matches your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.rfqId}</TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.material}</TableCell>
                      <TableCell className="font-medium">${item.totalValue.toFixed(2)}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${item.profit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {filteredData.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-xl font-bold">{filteredData.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">
                      ${filteredData.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Profit</p>
                    <p className="text-xl font-bold text-green-600">
                      ${filteredData.reduce((sum, item) => sum + item.profit, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;
