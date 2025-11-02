import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface RFQ {
  id: string;
  date: string;
  client: {
    name: string;
    company: string;
    email: string;
    phone: string;
  };
  items: any[];
  status: "Pending" | "Quoted" | "Completed";
}

const MyRFQs = () => {
  const [searchPhone, setSearchPhone] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch all RFQs from database
  const { data: allRFQs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/rfqs"],
  });

  const handleSearch = () => {
    if (!searchPhone.trim()) {
      return;
    }
    setHasSearched(true);
  };

  // Filter RFQs by phone number
  const filteredRFQs = hasSearched && searchPhone.trim()
    ? allRFQs.filter((rfq: any) => {
        const cleanSearchPhone = searchPhone.replace(/\s/g, '').replace(/^\+/, '');
        const cleanRFQPhone = rfq.clientPhone.replace(/\s/g, '').replace(/^\+/, '');
        return cleanRFQPhone.includes(cleanSearchPhone) || cleanSearchPhone.includes(cleanRFQPhone);
      })
    : [];

  const getStatusIcon = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "quoted":
        return <FileText className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg border-b border-primary/10">
        <div className="section-container py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <Link to="/platform" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg md:text-xl">S</span>
              </div>
              <span className="text-xl md:text-2xl font-bold">My RFQs</span>
            </Link>
            <Link to="/platform">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Platform
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="section-container py-6 md:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-primary">
              Track Your RFQs
            </h1>
            <p className="text-muted-foreground">
              Enter your phone number to view your submitted quotation requests
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Your RFQs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="+252 615 401 195"
                    className="mt-1.5"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Search My RFQs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && (
            <div className="animate-fade-in">
              {filteredRFQs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground text-lg">No RFQs found for this phone number</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Make sure you entered the same number used during submission
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Found {filteredRFQs.length} RFQ{filteredRFQs.length !== 1 ? 's' : ''}
                  </h2>
                  {filteredRFQs.map((rfq) => (
                    <Card key={rfq.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{rfq.id}</h3>
                              <Badge className={getStatusColor(rfq.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(rfq.status)}
                                  {rfq.status}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Submitted: {new Date(rfq.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Items: {rfq.items.length} material{rfq.items.length !== 1 ? 's' : ''}
                            </p>
                            {rfq.status === "Pending" && (
                              <p className="text-sm text-accent font-medium mt-2">
                                ⏳ Our team is reviewing your request
                              </p>
                            )}
                            {rfq.status === "Quoted" && (
                              <p className="text-sm text-blue-500 font-medium mt-2">
                                ✅ Quotation ready! Check your WhatsApp
                              </p>
                            )}
                            {rfq.status === "Completed" && (
                              <p className="text-sm text-green-600 font-medium mt-2">
                                ✅ Order completed
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="text-right md:text-left">
                              <p className="text-xs text-muted-foreground">Total Items</p>
                              <p className="text-2xl font-bold text-primary">
                                {rfq.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Items List */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">Materials:</p>
                          <div className="space-y-1">
                            {rfq.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                                <span>• {item.name}</span>
                                <span className="font-medium">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRFQs;
