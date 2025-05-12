import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import GoalsPage from "@/pages/goals-page";
import CommunityPage from "@/pages/community-page";
import AnalyticsPage from "@/pages/analytics-page";
import ChallengesPage from "@/pages/challenges-page";
import ChallengePage from "@/pages/challenge-page";
import AuthPage from "@/pages/auth-page";
import { DevProtectedRoute } from "./lib/dev-protected-route";
import { DevAuthProvider } from "./hooks/use-dev-auth";

// For production, these imports would be used:
// import { ProtectedRoute } from "./lib/protected-route";
// import { Auth0ProviderWithNavigate } from "./hooks/use-auth0";
// import Auth0Setup from "@/components/auth/auth0-setup";
// import { Auth0Config } from "@/hooks/use-auth0-config";

function Router() {
  return (
    <Switch>
      <DevProtectedRoute path="/" component={DashboardPage} />
      <DevProtectedRoute path="/goals" component={GoalsPage} />
      <DevProtectedRoute path="/community" component={CommunityPage} />
      <DevProtectedRoute path="/analytics" component={AnalyticsPage} />
      <DevProtectedRoute path="/challenges" component={ChallengesPage} />
      <DevProtectedRoute path="/challenges/:id" component={ChallengePage} />
      <Route path="/auth" component={AuthPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Development mode - no Auth0 configuration needed
  return (
    <QueryClientProvider client={queryClient}>
      <DevAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DevAuthProvider>
    </QueryClientProvider>
  );

  /* Production Auth0 implementation for future use:
  const [isAuth0Configured, setIsAuth0Configured] = useState<boolean | null>(null);
  
  useEffect(() => {
    setIsAuth0Configured(Auth0Config.isConfigured());
  }, []);
  
  // Show loading state until we determine if Auth0 is configured
  if (isAuth0Configured === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Show Auth0 setup screen if not configured
  if (!isAuth0Configured) {
    return <Auth0Setup />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0ProviderWithNavigate>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </Auth0ProviderWithNavigate>
    </QueryClientProvider>
  );
  */
}

export default App;
