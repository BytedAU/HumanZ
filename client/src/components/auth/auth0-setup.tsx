import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Auth0Config } from '@/hooks/use-auth0-config';

export default function Auth0Setup() {
  const [domain, setDomain] = useState('');
  const [clientId, setClientId] = useState('');
  const [audience, setAudience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real implementation, we'd store these values somewhere
    // For demo purposes, we'll reload the page to use the new values from localStorage
    localStorage.setItem('auth0_domain', domain);
    localStorage.setItem('auth0_client_id', clientId);
    if (audience) localStorage.setItem('auth0_audience', audience);
    
    // Reload to apply changes
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Auth0 Configuration</CardTitle>
          <CardDescription>
            Configure Auth0 to enable authentication in HumanZ.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Auth0 Domain</Label>
              <Input 
                id="domain" 
                type="text" 
                placeholder="your-tenant.auth0.com" 
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input 
                id="clientId" 
                type="text" 
                placeholder="Your Auth0 Client ID" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audience">API Audience (Optional)</Label>
              <Input 
                id="audience" 
                type="text" 
                placeholder="Your Auth0 API Audience" 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Only required if you're using Auth0 API access.
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Configuration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Need help? <a href="https://auth0.com/docs/quickstart/spa/react" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            View Auth0 React documentation
          </a>
        </p>
      </div>
    </div>
  );
}