import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const FinanceTracking = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    totalCommissions: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    const completedRFQs = storedRFQs.filter((rfq: any) => rfq.status === "Completed");

    let revenue = 0;
    let costs = 0;
    let profit = 0;

    completedRFQs.forEach((rfq: any) => {
      rfq.items?.forEach((item: any) => {
        if (item.suppliers) {
          Object.values(item.suppliers).forEach((supplier: any) => {
            const basePrice = supplier.basePrice || 0;
            const markup = supplier.markup || 0;
            const qty = item.quantity || 0;

            costs += basePrice * qty;
            revenue += (basePrice + markup) * qty;
            profit += markup * qty;
          });
        }
      });
    });

    setFinancialData({
      totalRevenue: revenue,
      totalCosts: costs,
      totalProfit: profit,
      totalCommissions: profit * 0.1, // 10% commission estimate
    });
  }, []);

  // Monthly profit data (last 6 months)
  const monthlyData = [
    { month: "Jan", profit: 12500, revenue: 45000, costs: 32500 },
    { month: "Feb", profit: 15200, revenue: 52000, costs: 36800 },
    { month: "Mar", profit: 13800, revenue: 48000, costs: 34200 },
    { month: "Apr", profit: 18300, revenue: 61000, costs: 42700 },
    { month: "May", profit: 16500, revenue: 55000, costs: 38500 },
    { month: "Jun", profit: 20100, revenue: 67000, costs: 46900 },
  ];

  const exportToExcel = () => {
    const data = [
      ["SOMVI Financial Report"],
      [""],
      ["Summary"],
      ["Total Revenue", financialData.totalRevenue],
      ["Total Costs", financialData.totalCosts],
      ["Total Profit", financialData.totalProfit],
      ["Total Commissions", financialData.totalCommissions],
      [""],
      ["Monthly Breakdown"],
      ["Month", "Revenue", "Costs", "Profit"],
      ...monthlyData.map((d) => [d.month, d.revenue, d.costs, d.profit]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, "SOMVI_Financial_Report.xlsx");

    toast({ title: "Excel report downloaded" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("SOMVI Financial Report", 20, 20);

    doc.setFontSize(12);
    doc.text("Summary", 20, 40);
    doc.text(`Total Revenue: $${financialData.totalRevenue.toFixed(2)}`, 20, 50);
    doc.text(`Total Costs: $${financialData.totalCosts.toFixed(2)}`, 20, 60);
    doc.text(`Total Profit: $${financialData.totalProfit.toFixed(2)}`, 20, 70);
    doc.text(`Total Commissions: $${financialData.totalCommissions.toFixed(2)}`, 20, 80);

    doc.save("SOMVI_Financial_Report.pdf");

    toast({ title: "PDF report downloaded" });
  };

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialData.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialData.totalCosts.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Supplier costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${financialData.totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net profit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commissions</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${financialData.totalCommissions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimated 10%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  <Bar dataKey="costs" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Financial Reports</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FinanceTracking;
