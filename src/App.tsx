import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/lib/auth-context";
import { queryClient } from "@/lib/queryClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Platform from "./pages/Platform";
import MyRFQs from "./pages/MyRFQs";
import DealsPage from "./pages/DealsPage";
import MyProjectsPage from "./pages/MyProjectsPage";
import Login from "./pages/Login";
import RFQDetails from "./pages/RFQDetails";
import CompletedOrders from "./pages/CompletedOrders";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import RFQManagement from "./pages/admin/RFQManagement";
import AddRFQ from "./pages/admin/AddRFQ";
import SupplierManagement from "./pages/admin/SupplierManagement";
import ClientManagement from "./pages/admin/ClientManagement";
import MaterialManagement from "./pages/admin/MaterialManagement";
import FinanceTracking from "./pages/admin/FinanceTracking";
import Reports from "./pages/admin/Reports";
import MarkupManagement from "./pages/admin/MarkupManagement";
import SettingsPage from "./pages/admin/Settings";
import UsersManagement from "./pages/admin/UsersManagement";
import SalesPipeline from "./pages/admin/SalesPipeline";
import Deals from "./pages/admin/Deals";
import Projects from "./pages/admin/Projects";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/platform" component={Platform} />
            <Route path="/my-rfqs" component={MyRFQs} />
            <Route path="/deals" component={DealsPage} />
            <Route path="/my-projects" component={MyProjectsPage} />
            <Route path="/login" component={Login} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/rfqs">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'assistant']}>
                  <RFQManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/rfqs/new">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'assistant']}>
                  <AddRFQ />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/rfq/:id">
              {(params) => (
                <ProtectedRoute allowedRoles={['admin', 'assistant']}>
                  <RFQDetails />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/suppliers">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'procurement']}>
                  <SupplierManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/clients">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <ClientManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/materials">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'procurement']}>
                  <MaterialManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/markup">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <MarkupManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/finance">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <FinanceTracking />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/reports">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/settings">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/users">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersManagement />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/pipeline">
              {() => (
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesPipeline />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/completed">
              {() => (
                <ProtectedRoute>
                  <CompletedOrders />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/deals">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <Deals />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/projects">
              {() => (
                <ProtectedRoute allowedRoles={['admin']}>
                  <Projects />
                </ProtectedRoute>
              )}
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route component={NotFound} />
          </Switch>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
