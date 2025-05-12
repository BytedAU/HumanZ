import { useDevAuth } from "@/hooks/use-dev-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

export function DevProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useDevAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {isAuthenticated ? (
        <Component />
      ) : (
        <NoAuthPlaceholder onLogin={() => 
          loginWithRedirect({
            appState: { returnTo: path },
          })
        } />
      )}
    </Route>
  );
}

function NoAuthPlaceholder({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome to HumanZ</h2>
        <p className="text-gray-600 mb-8 text-center">
          Please log in to access your personal growth dashboard and track your progress.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onLogin}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Log In (Development)
          </button>
        </div>
      </div>
    </div>
  );
}