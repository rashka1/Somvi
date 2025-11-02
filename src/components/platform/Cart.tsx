import { useState } from "react";
import { X, Trash2, Send, Upload, MessageCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CartProps {
  open: boolean;
  onClose: () => void;
}

const Cart = ({ open, onClose }: CartProps) => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [clientInfo, setClientInfo] = useState({
    name: "",
    company: "",
    whatsapp: "",
    projectName: "",
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const registerClientMutation = useMutation({
    mutationFn: async (data: { name: string; whatsapp: string; company?: string }) => {
      return await apiRequest("/api/clients/register-or-find", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });

  const createRFQMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/rfqs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      
      // Prepare WhatsApp message
      const itemsList = cart.map((item) => `• ${item.name} - ${item.quantity} ${item.unit}`).join('\n');
      const whatsappMessage = `Hello ${clientInfo.name}, your request has been received!\n\n🎉 *RFQ Submitted Successfully!*\n\n*RFQ Number:* ${data.rfqNumber}\n*Project:* ${clientInfo.projectName}\n${clientInfo.company ? `*Company:* ${clientInfo.company}\n` : ''}\n*Materials Requested:*\n${itemsList}\n\nThank you for using SOMVI! Our procurement team will review your request and send you a quotation shortly.`;
      
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const cleanPhone = clientInfo.whatsapp.replace(/\s/g, '').replace(/^\+/, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      toast({
        title: "RFQ Submitted Successfully! ✅",
        description: `Your RFQ number is ${data.rfqNumber}. Sending confirmation via WhatsApp...`,
      });
      
      // Open WhatsApp with confirmation message
      window.open(whatsappUrl, '_blank');
      
      clearCart();
      setClientInfo({ name: "", company: "", whatsapp: "", projectName: "" });
      setAttachedFile(null);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit RFQ. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size (max 10MB)
      const validTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Excel file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleSubmitRFQ = async () => {
    // Validation
    if (!clientInfo.name || !clientInfo.whatsapp || !clientInfo.projectName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, WhatsApp, Project Name).",
        variant: "destructive",
      });
      return;
    }

    // Validate WhatsApp format (Somalia +252 or Kenya +254)
    const whatsappRegex = /^(\+252|\+254)[0-9]{9}$/;
    const cleanWhatsapp = clientInfo.whatsapp.replace(/\s/g, '');
    if (!whatsappRegex.test(cleanWhatsapp)) {
      toast({
        title: "Invalid WhatsApp Number",
        description: "Please enter a valid WhatsApp number starting with +252 (Somalia) or +254 (Kenya)",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add materials to your cart before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Register or find client
      const client = await registerClientMutation.mutateAsync({
        name: clientInfo.name,
        whatsapp: cleanWhatsapp,
        company: clientInfo.company || undefined,
      });

      // Step 2: Create RFQ with client ID
      const rfqData = {
        clientId: client.id,
        projectName: clientInfo.projectName,
        status: "pending",
        attachedFile: attachedFile?.name || null,
        items: cart.map(item => ({
          materialId: parseInt(item.id),
          materialName: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })),
      };

      createRFQMutation.mutate(rfqData);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register client. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Your Cart</SheetTitle>
          <SheetDescription>
            Review your materials and submit a Request for Quotation
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Cart Items */}
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add materials to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-semibold text-sm">Cart Items ({cart.length})</h3>
                <p className="text-xs text-muted-foreground">Total: {cart.reduce((sum, item) => sum + item.quantity, 0)} units</p>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border rounded-lg hover:border-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Label className="text-xs">Qty:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Client Information Form */}
          {cart.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-base">Your Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-sm">Full Name *</Label>
                  <Input
                    id="name"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1.5"
                    required
                    data-testid="input-client-name"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-sm">Company Name (Optional)</Label>
                  <Input
                    id="company"
                    value={clientInfo.company}
                    onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
                    placeholder="Optional"
                    className="mt-1.5"
                    data-testid="input-client-company"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="text-sm">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={clientInfo.whatsapp}
                    onChange={(e) => setClientInfo({ ...clientInfo, whatsapp: e.target.value })}
                    placeholder="+252 615 401 195 or +254 700 123 456"
                    className="mt-1.5"
                    required
                    data-testid="input-client-whatsapp"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Somalia (+252) or Kenya (+254) numbers only
                  </p>
                </div>
                <div>
                  <Label htmlFor="projectName" className="text-sm">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={clientInfo.projectName}
                    onChange={(e) => setClientInfo({ ...clientInfo, projectName: e.target.value })}
                    placeholder="e.g., Office Building Construction"
                    className="mt-1.5"
                    required
                    data-testid="input-project-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    What is this request for?
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="file" className="text-sm">Attach Document (Optional)</Label>
                  <div className="mt-1.5">
                    <label htmlFor="file" className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-accent transition-colors">
                      <div className="text-center">
                        {attachedFile ? (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="w-5 h-5 text-accent" />
                            <p className="text-xs font-medium text-accent truncate max-w-[200px]">{attachedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Upload PDF or Excel (Max 10MB)</p>
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.xls,.xlsx"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmitRFQ}
                disabled={createRFQMutation.isPending || registerClientMutation.isPending}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 font-semibold"
                data-testid="button-submit-rfq"
              >
                {(createRFQMutation.isPending || registerClientMutation.isPending) ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Submit RFQ via WhatsApp
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to receive quotations from SOMVI
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
