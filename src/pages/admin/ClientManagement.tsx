import { useState, useEffect } from "react";
import { Users, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { useLocation } from "wouter";

interface Client {
  name: string;
  company: string;
  email: string;
  phone: string;
  rfqCount: number;
  totalValue: number;
  lastActive: string;
}

const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedRFQs = JSON.parse(localStorage.getItem("rfqs") || "[]");
    
    // Group RFQs by client
    const clientMap = new Map<string, Client>();
    
    storedRFQs.forEach((rfq: any) => {
      const key = rfq.client.phone;
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: rfq.client.name,
          company: rfq.client.company || "N/A",
          email: rfq.client.email,
          phone: rfq.client.phone,
          rfqCount: 0,
          totalValue: 0,
          lastActive: rfq.date,
        });
      }
      
      const client = clientMap.get(key)!;
      client.rfqCount++;
      
      // Calculate RFQ value
      let rfqValue = 0;
      rfq.items?.forEach((item: any) => {
        if (item.suppliers) {
          Object.values(item.suppliers).forEach((supplier: any) => {
            rfqValue += ((supplier.basePrice || 0) + (supplier.markup || 0)) * (item.quantity || 0);
          });
        }
      });
      client.totalValue += rfqValue;
      
      // Update last active date
      if (new Date(rfq.date) > new Date(client.lastActive)) {
        client.lastActive = rfq.date;
      }
    });
    
    setClients(Array.from(clientMap.values()));
  }, []);

  const sendWhatsAppMessage = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hello ${name}, thank you for your interest in SOMVI. How can we assist you today?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  return (
    <AdminLayout>
      <div className="section-container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Client Management (CRM)</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No clients yet.</p>
                <Button onClick={() => setLocation("/platform")}>
                  Go to Client Portal
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>RFQs</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.company}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.phone}</Badge>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        <Badge>{client.rfqCount}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${client.totalValue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(client.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation("/admin/rfqs")}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View RFQs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => sendWhatsAppMessage(client.phone, client.name)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
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

export default ClientManagement;
