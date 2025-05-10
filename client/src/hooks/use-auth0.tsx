import { Auth0Provider, Auth0ProviderOptions, useAuth0 } from '@auth0/auth0-react';
import { ReactNode } from 'react';
import { useLocation } from 'wouter';

import { Auth0Config } from './use-auth0-config';

// Use Auth0Config for configuration values
const domain = Auth0Config.domain;
const clientId = Auth0Config.clientId;
const audience = Auth0Config.audience;

interface Auth0ProviderWithNavigateProps {
  children: ReactNode;
}

export const Auth0ProviderWithNavigate = ({ children }: Auth0ProviderWithNavigateProps) => {
  const [_location, navigate] = useLocation();

  const onRedirectCallback = (appState: any) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  const providerConfig: Auth0ProviderOptions = {
    domain,
    clientId,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience,
    },
    onRedirectCallback,
  };

  return <Auth0Provider {...providerConfig}>{children}</Auth0Provider>;
};

export { useAuth0 };

// Auth0 login button component with customizable appearance
export function LoginButton() {
  const { loginWithRedirect } = useAuth0();

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
    >
      Log In
    </button>
  );
}

// Auth0 signup button component with customizable appearance
export function SignupButton() {
  const { loginWithRedirect } = useAuth0();

  return (
    <button
      onClick={() =>
        loginWithRedirect({
          authorizationParams: {
            screen_hint: 'signup',
          },
        })
      }
      className="bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
    >
      Sign Up
    </button>
  );
}

// Auth0 logout button component with customizable appearance
export function LogoutButton() {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() =>
        logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        })
      }
      className="bg-muted hover:bg-muted/80 text-primary font-medium py-2 px-4 rounded-md transition-colors"
    >
      Log Out
    </button>
  );
}

// Authentication guard component as a regular function
export function withAuthenticationRequired(Component: React.ComponentType, options: { returnTo?: string } = {}) {
  // Return a named function for better compatibility with fast refresh
  function WithAuthenticationRequired() {
    const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
    const [_location, navigate] = useLocation();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: options.returnTo || window.location.pathname },
      });
      return null;
    }

    return <Component />;
  }
  
  return WithAuthenticationRequired;
}