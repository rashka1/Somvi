import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Search, FileText, Loader2, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCart } from "@/contexts/CartContext";
import Cart from "@/components/platform/Cart";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tag } from "lucide-react";
import { format } from "date-fns";

interface Material {
  id: number;
  nameEn: string;
  nameSo: string | null;
  unit: string | null;
  unitSo: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  descriptionSo: string | null;
  imageUrl: string | null;
  active: boolean;
}

interface Deal {
  id: number;
  title: string;
  discount: number;
  validFrom: string;
  validTo: string;
  description: string | null;
  materialId: number | null;
  district: string | null;
}

const Platform = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cartCount } = useCart();
  const { toast } = useToast();

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: broadcastDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals/broadcast"],
  });

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || m.subcategory === selectedSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Group materials by category and subcategory for sidebar
  const categoriesWithSubs = materials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = new Set();
    }
    if (material.subcategory) {
      acc[material.category].add(material.subcategory);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const handleOpenQuantityDialog = (material: Material) => {
    setSelectedMaterial(material);
    setQuantity(1);
    setShowQuantityDialog(true);
  };

  const handleAddToCart = () => {
    if (!selectedMaterial) return;
    
    const cartMaterial = {
      id: selectedMaterial.id.toString(),
      name: selectedMaterial.nameEn,
      description: selectedMaterial.description || "",
      unit: selectedMaterial.unit || "unit",
      category: selectedMaterial.category,
      image: selectedMaterial.imageUrl,
    };
    
    // Add with the specified quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(cartMaterial);
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity} ${selectedMaterial.unit || 'unit'}(s) of ${selectedMaterial.nameEn} added to your cart.`,
    });
    
    setShowQuantityDialog(false);
    setSelectedMaterial(null);
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading materials catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg border-b border-primary/10">
        <div className="section-container py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg md:text-xl">S</span>
              </div>
              <span className="text-xl md:text-2xl font-bold">SOMVI Platform</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/my-rfqs">
                <Button
                  variant="outline"
                  className="hidden sm:flex border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Track RFQs
                </Button>
              </Link>
              <Button
                onClick={() => setShowCart(true)}
                className="relative bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="section-container py-6 md:py-10">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-primary">
            Buy Construction Materials
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse our wide selection of quality building materials
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 animate-fade-in">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-sm"
              data-testid="input-search-materials"
            />
          </div>
        </div>

        {/* Layout with Sidebar and Materials Grid */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0 space-y-1">
            <h2 className="font-semibold text-sm mb-3 text-primary uppercase tracking-wide">Products We Offer</h2>
            <Button
              variant={selectedCategory === "All" ? "default" : "ghost"}
              onClick={() => {
                setSelectedCategory("All");
                setSelectedSubcategory(null);
              }}
              className="w-full justify-start h-9 text-sm font-normal"
              data-testid="button-category-all"
            >
              All Products
            </Button>
            {Object.entries(categoriesWithSubs).map(([category, subcategories]) => (
              <Collapsible key={category} className="w-full">
                <CollapsibleTrigger asChild>
                  <Button
                    variant={selectedCategory === category ? "default" : "ghost"}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedSubcategory(null);
                    }}
                    className="w-full justify-between h-9 text-sm font-normal"
                    data-testid={`button-category-${category}`}
                  >
                    <span>{category}</span>
                    {subcategories.size > 0 && (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                {subcategories.size > 0 && (
                  <CollapsibleContent className="pl-3 mt-1 space-y-0.5">
                    {Array.from(subcategories).map((sub) => (
                      <Button
                        key={sub}
                        variant={selectedSubcategory === sub ? "secondary" : "ghost"}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedSubcategory(sub);
                        }}
                        className="w-full justify-start text-xs h-8 font-normal text-muted-foreground hover:text-foreground"
                        data-testid={`button-subcategory-${sub}`}
                      >
                        {sub}
                      </Button>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
          </aside>

          {/* Materials Grid */}
          <main className="flex-1">
            {/* Broadcast Deals Banner */}
            {broadcastDeals.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">Active Deals</h3>
                </div>
                {broadcastDeals.map((deal) => {
                  const material = materials.find((m) => m.id === deal.materialId);
                  return (
                    <Alert key={deal.id} className="border-2 border-primary bg-primary/5" data-testid={`deal-banner-${deal.id}`}>
                      <Tag className="w-4 h-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{deal.title}</span>
                        <Badge variant="secondary" className="text-lg font-bold">
                          {deal.discount}% OFF
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {deal.description && (
                          <p className="text-sm mb-2">{deal.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {material && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {material.nameEn}
                            </span>
                          )}
                          {deal.district && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {deal.district}
                            </span>
                          )}
                          <span className="bg-muted px-2 py-1 rounded">
                            Valid until {format(new Date(deal.validTo), "MMM d, yyyy")}
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Results for "{selectedCategory === "All" ? "All Products" : selectedCategory}"
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col border-gray-200">
                  {material.imageUrl && (
                    <div className="h-44 overflow-hidden bg-gray-50 relative">
                      <img
                        src={material.imageUrl}
                        alt={material.nameEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">
                      {material.nameEn}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 flex-grow">
                    {material.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {material.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 px-4 pb-3">
                    <Button 
                      onClick={() => handleOpenQuantityDialog(material)} 
                      variant="outline"
                      className="w-full h-9 text-sm font-medium border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                      data-testid={`button-add-material-${material.id}`}
                    >
                      Add
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No materials match your search.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Quantity Selector Dialog */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Quantity</DialogTitle>
            <DialogDescription>
              {selectedMaterial && (
                <span className="text-foreground font-medium">
                  {selectedMaterial.nameEn}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="flex flex-col gap-6 py-4">
              {/* Material Image and Info */}
              <div className="flex items-center gap-4">
                {selectedMaterial.imageUrl && (
                  <img
                    src={selectedMaterial.imageUrl}
                    alt={selectedMaterial.nameEn}
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{selectedMaterial.nameEn}</h3>
                  <p className="text-sm text-muted-foreground">
                    Unit: {selectedMaterial.unit || "unit"}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {selectedMaterial.category}
                  </Badge>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-lg font-semibold w-24"
                    data-testid="input-quantity"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {quantity} {selectedMaterial.unit || "unit"}(s)
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuantityDialog(false)}
              data-testid="button-cancel-quantity"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddToCart}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-testid="button-confirm-add"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <Cart open={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
};

export default Platform;
