import { useAuth } from "@/hooks/use-dev-auth";
import { Button } from "@/components/ui/button";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type DevProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

export function DevProtectedRoute({ path, component: Component }: DevProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user ? (
        <Component />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to log in to access this page. Please create an account or log in to continue.
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setLocation("/auth")}>
              Log In / Register
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      )}
    </Route>
  );
}