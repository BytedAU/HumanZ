import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Mock user data for development
const MOCK_USERS = [
  {
    id: 1,
    name: 'Development User',
    email: 'dev@example.com',
    picture: 'https://i.pravatar.cc/150?u=dev',
    sub: 'dev_user_1',
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://i.pravatar.cc/150?u=test',
    sub: 'test_user_1',
  }
];

// Mock user interface to mimic Auth0 user
interface DevUser {
  id: number;
  name: string;
  email: string;
  picture: string;
  sub: string;
}

// Context type definition
interface DevAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: DevUser | null;
  loginWithRedirect: (options?: any) => void;
  logout: (options?: any) => void;
  getAccessTokenSilently: () => Promise<string>;
}

// Create context with default values
const DevAuthContext = createContext<DevAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  loginWithRedirect: () => {},
  logout: () => {},
  getAccessTokenSilently: async () => 'dev-token',
});

// Key for localstorage
const AUTH_STORAGE_KEY = 'dev_auth_state';

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DevUser | null>(null);
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        setUser(parsedAuth.user);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored auth data', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const loginWithRedirect = (options?: any) => {
    // For development, we'll show a simple modal dialog for user selection
    // In a real app, this would redirect to Auth0
    
    // For now, just log in as the first mock user
    const selectedUser = MOCK_USERS[0];
    
    setUser(selectedUser);
    setIsAuthenticated(true);
    
    // Store in localStorage for persistence
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: selectedUser }));
    
    toast({
      title: 'Development login',
      description: `Logged in as ${selectedUser.name}`,
    });
    
    // Handle any return_to path from options
    if (options?.appState?.returnTo) {
      window.location.href = options.appState.returnTo;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    toast({
      title: 'Logged out',
      description: 'You have been logged out of the development account',
    });
  };

  // Mock token function (for API calls)
  const getAccessTokenSilently = async () => {
    return 'dev-mock-token-for-api-calls';
  };

  const contextValue: DevAuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  };

  return (
    <DevAuthContext.Provider value={contextValue}>
      {children}
    </DevAuthContext.Provider>
  );
}

// Hook for accessing the auth context
export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useDevAuth must be used within a DevAuthProvider');
  }
  return context;
}

// Development login selection modal
export function DevLoginModal({ onClose, onLogin }: { 
  onClose: () => void, 
  onLogin: (user: DevUser) => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Development Login</h2>
        <p className="text-gray-600 mb-4">Select a user to login as:</p>
        
        <div className="space-y-2">
          {MOCK_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="flex items-center space-x-3 w-full p-3 rounded-md hover:bg-gray-100 transition"
            >
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-10 h-10 rounded-full"
              />
              <div className="text-left">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}