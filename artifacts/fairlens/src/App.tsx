import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import LandingPage from "@/pages/landing";
import AboutPage from "@/pages/about";
import AppEntryDashboardPage from "@/pages/app-entry";
import Dashboard from "@/pages/dashboard";
import NewPrediction from "@/pages/new-prediction";
import BatchPrediction from "@/pages/batch-prediction";
import BiasMonitor from "@/pages/bias-monitor";
import Explainability from "@/pages/explainability";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/app-dashboard" component={AppEntryDashboardPage} />

      <Route path="/app">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/app/new-prediction">
        <Layout>
          <NewPrediction />
        </Layout>
      </Route>
      <Route path="/app/batch-prediction">
        <Layout>
          <BatchPrediction />
        </Layout>
      </Route>
      <Route path="/app/bias-monitor">
        <Layout>
          <BiasMonitor />
        </Layout>
      </Route>
      <Route path="/app/explainability">
        <Layout>
          <Explainability />
        </Layout>
      </Route>
      <Route path="/app/logs">
        <Layout>
          <Logs />
        </Layout>
      </Route>
      <Route path="/app/settings">
        <Layout>
          <Settings />
        </Layout>
      </Route>

      {/* Backward-compatible aliases for old cockpit URLs */}
      <Route path="/new-prediction">
        <Layout>
          <NewPrediction />
        </Layout>
      </Route>
      <Route path="/batch-prediction">
        <Layout>
          <BatchPrediction />
        </Layout>
      </Route>
      <Route path="/bias-monitor">
        <Layout>
          <BiasMonitor />
        </Layout>
      </Route>
      <Route path="/explainability">
        <Layout>
          <Explainability />
        </Layout>
      </Route>
      <Route path="/logs">
        <Layout>
          <Logs />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
