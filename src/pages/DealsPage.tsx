import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Calendar, MapPin, ShoppingCart, Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { MOGADISHU_DISTRICTS } from "@shared/schema";
import type { Deal, Material } from "@shared/schema";

export default function DealsPage() {
  const [, setLocation] = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  // Filter active broadcast deals
  const now = new Date();
  let activeDeals = deals.filter(
    (deal) =>
      deal.broadcast &&
      deal.status === "active" &&
      new Date(deal.validFrom) <= now &&
      new Date(deal.validTo) >= now
  );

  // Apply district filter
  if (selectedDistrict !== "all") {
    activeDeals = activeDeals.filter(
      (deal) => !deal.district || deal.district === selectedDistrict || deal.district === ""
    );
  }

  // Apply material filter
  if (selectedMaterial !== "all") {
    activeDeals = activeDeals.filter(
      (deal) => !deal.materialId || deal.materialId === parseInt(selectedMaterial)
    );
  }

  const getMaterialInfo = (materialId: number | null) => {
    if (!materialId) return null;
    return materials.find((m) => m.id === materialId);
  };

  const handleRequestQuote = (deal: Deal) => {
    const material = getMaterialInfo(deal.materialId);
    if (material) {
      // Store deal info in session storage to prefill RFQ form
      sessionStorage.setItem('selectedDeal', JSON.stringify({
        materialId: material.id,
        materialName: material.nameEn,
        discount: deal.discount,
        dealTitle: deal.title,
      }));
    }
    setLocation("/platform");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="section-container py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Tag className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Active Deals</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get exclusive discounts on construction materials. Limited time offers!
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">District</label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger data-testid="select-district-filter">
                        <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {MOGADISHU_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Material</label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger data-testid="select-material-filter">
                        <SelectValue placeholder="All Materials" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading deals...</p>
              </div>
            ) : activeDeals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Deals</h3>
                  <p className="text-muted-foreground mb-6">
                    Check back soon for exciting offers on construction materials!
                  </p>
                  <Button onClick={() => setLocation("/platform")} data-testid="button-browse-materials">
                    Browse All Materials
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeals.map((deal) => {
                  const material = getMaterialInfo(deal.materialId);
                  return (
                    <Card key={deal.id} className="hover:shadow-lg transition-shadow" data-testid={`card-deal-${deal.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="default" className="mb-2">
                            {deal.discount}% OFF
                          </Badge>
                          {deal.district && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {deal.district}
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-xl" data-testid={`text-deal-title-${deal.id}`}>
                          {deal.title}
                        </CardTitle>
                        <CardDescription>
                          {material ? material.nameEn : "All Materials"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {deal.description && (
                          <p className="text-sm text-muted-foreground">{deal.description}</p>
                        )}
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            Valid until {format(new Date(deal.validTo), "MMM d, yyyy")}
                          </span>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => handleRequestQuote(deal)}
                          data-testid={`button-request-quote-${deal.id}`}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Request Quotation
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
