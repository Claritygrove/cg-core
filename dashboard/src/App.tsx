import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Integrations from "@/pages/Integrations";
import StoreInfo from "@/pages/Recommendations";
import TechTroubleshooting from "@/pages/TechTroubleshooting";
import ContactInfo from "@/pages/ContactInfo";
import NewProductVendors from "@/pages/NewProductVendors";
import HR from "@/pages/HR";
import AskEV from "@/pages/AskEV";
import EVUniversity from "@/pages/EVUniversity";
import BusinessPlans from "@/pages/BusinessPlans";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import FloorPlanPage from "@/modules/floor-plan/FloorPlanPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  feature,
}: {
  component: React.ComponentType;
  feature?: "business_plans" | "net_profit" | "user_management";
}) {
  const { user, loading, canAccess } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  if (feature && !canAccess(feature)) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Unauthenticated: show login
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Authenticated: show app
  return (
    <Switch>
      <Route path="/login"><Redirect to="/" /></Route>
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/store-info" component={StoreInfo} />
            <Route path="/floor-plan" component={FloorPlanPage} />
            <Route path="/reports" component={Reports} />
            <Route path="/tech-troubleshooting" component={TechTroubleshooting} />
            <Route path="/contacts" component={ContactInfo} />
            <Route path="/vendors" component={NewProductVendors} />
            <Route path="/hr" component={HR} />
            <Route path="/ask-ev" component={AskEV} />
            <Route path="/ev-university" component={EVUniversity} />
            <Route
              path="/business-plans"
              component={() => <ProtectedRoute component={BusinessPlans} feature="business_plans" />}
            />
            <Route
              path="/users"
              component={() => <ProtectedRoute component={UserManagement} feature="user_management" />}
            />
            <Route path="/integrations" component={Integrations} />
            <Route path="/recommendations"><Redirect to="/store-info" /></Route>
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
