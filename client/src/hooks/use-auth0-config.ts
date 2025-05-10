// Auth0 configuration helper with localStorage fallback for development
export const Auth0Config = {
  get domain() {
    return import.meta.env.VITE_AUTH0_DOMAIN as string || 
           (typeof window !== 'undefined' ? localStorage.getItem('auth0_domain') || '' : '');
  },
  
  get clientId() {
    return import.meta.env.VITE_AUTH0_CLIENT_ID as string || 
           (typeof window !== 'undefined' ? localStorage.getItem('auth0_client_id') || '' : '');
  },
  
  get audience() {
    return import.meta.env.VITE_AUTH0_AUDIENCE as string || 
           (typeof window !== 'undefined' ? localStorage.getItem('auth0_audience') || '' : '');
  },
  
  get redirect() {
    return window.location.origin;
  },
  
  // Check if Auth0 configuration is complete
  isConfigured: () => {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN || 
                  (typeof window !== 'undefined' ? localStorage.getItem('auth0_domain') : null);
    
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 
                    (typeof window !== 'undefined' ? localStorage.getItem('auth0_client_id') : null);
    
    return !!domain && !!clientId;
  }
};