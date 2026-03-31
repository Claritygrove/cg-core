import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/store-info" component={StoreInfo} />
            <Route path="/tech-troubleshooting" component={TechTroubleshooting} />
            <Route path="/contacts" component={ContactInfo} />
            <Route path="/vendors" component={NewProductVendors} />
            <Route path="/hr" component={HR} />
            <Route path="/ask-ev" component={AskEV} />
            <Route path="/ev-university" component={EVUniversity} />
            <Route path="/business-plans" component={BusinessPlans} />
            <Route path="/integrations" component={Integrations} />
            {/* Legacy redirect */}
            <Route path="/recommendations">
              <Redirect to="/store-info" />
            </Route>
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
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
