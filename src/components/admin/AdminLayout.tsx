import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  TrendingUp, 
  FileBarChart,
  Building2,
  Percent,
  Settings,
  UserCog,
  LogOut,
  Columns,
  Tag,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "RFQ Management", href: "/admin/rfqs", icon: FileText },
  { name: "Sales Pipeline", href: "/admin/pipeline", icon: Columns },
  { name: "Deals", href: "/admin/deals", icon: Tag },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Suppliers", href: "/admin/suppliers", icon: Building2 },
  { name: "Clients", href: "/admin/clients", icon: Users },
  { name: "Materials", href: "/admin/materials", icon: Package },
  { name: "Markup", href: "/admin/markup", icon: Percent },
  { name: "Finance", href: "/admin/finance", icon: TrendingUp },
  { name: "Reports", href: "/admin/reports", icon: FileBarChart },
  { name: "Users", href: "/admin/users", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="section-container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">SOMVI Admin</h1>
                <p className="text-xs opacity-80">Procurement Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm">
                  <span className="opacity-80">{user.name}</span>
                  <span className="ml-2 px-2 py-1 bg-accent/20 rounded text-xs capitalize">{user.role}</span>
                </div>
              )}
              <Link href="/platform" className="text-sm hover:text-accent transition-colors">
                View Client Portal →
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Side Navigation */}
        <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-80px)] sticky top-20">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                              (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
