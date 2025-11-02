import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Building2, MessageSquare, Upload, Save } from "lucide-react";
import type { Settings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const SettingsPage = () => {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setDescription(settings.description || "");
      setWhatsappNumber(settings.whatsappNumber || "");
      setLogoUrl(settings.logoUrl || "");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { 
      companyName: string; 
      description: string; 
      whatsappNumber: string;
      logoUrl: string;
    }) => {
      if (settings?.id) {
        return apiRequest(`/api/settings/${settings.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest("/api/settings", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Company settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      companyName,
      description,
      whatsappNumber,
      logoUrl,
    });
  };

  return (
    <AdminLayout>
      <div className="section-container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company information and platform settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic information about your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., SOMVI Somalia"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    data-testid="input-company-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your company..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    data-testid="input-company-description"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be displayed on quotations and client communications
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp Settings
                </CardTitle>
                <CardDescription>
                  Configure WhatsApp for client communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="e.g., +252615401195"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    data-testid="input-whatsapp-number"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +252 for Somalia, +254 for Kenya)
                  </p>
                </div>

                {whatsappNumber && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Current WhatsApp
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-300">
                      {whatsappNumber}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Logo Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Company Logo
              </CardTitle>
              <CardDescription>
                Upload your company logo for quotations and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  data-testid="input-logo-url"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your logo image (recommended size: 200x200px)
                </p>
              </div>

              {logoUrl && (
                <div className="space-y-2">
                  <Label>Logo Preview</Label>
                  <div className="p-4 border border-border rounded-lg bg-muted/50 flex items-center justify-center">
                    <img 
                      src={logoUrl} 
                      alt="Company Logo Preview" 
                      className="max-h-32 max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16'%3EInvalid URL%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={updateSettingsMutation.isPending || isLoading}
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>

        {/* Current Settings Summary */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle>Current Settings Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{settings.companyName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp Number</p>
                  <p className="font-medium">{settings.whatsappNumber || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Markup</p>
                  <p className="font-medium">
                    {settings.defaultMarkup 
                      ? `${settings.markupType === "flat" ? "$" : ""}${settings.defaultMarkup}${settings.markupType === "percentage" ? "%" : ""}`
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax Rate</p>
                  <p className="font-medium">{settings.taxRate ? `${settings.taxRate}%` : "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
