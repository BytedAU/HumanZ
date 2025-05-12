import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-dev-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Users, BadgeCheck, Lock } from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  // If user is already logged in, redirect to home
  if (user) {
    setLocation('/');
    return null;
  }
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword
    });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      name: registerName,
      username: registerUsername,
      email: registerEmail,
      password: registerPassword
    });
  };
  
  // Dev mode shortcut for quick login
  const handleDevLogin = () => {
    loginMutation.mutate({
      username: 'testuser',
      password: 'password123'
    });
  };
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Welcome to HumanZ</h1>
            <p className="text-muted-foreground">Your personal growth and development platform</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <form onSubmit={handleLogin}>
                  <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                      Enter your username and password to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        type="text" 
                        placeholder="Enter your username" 
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-sm text-primary hover:text-primary/90">
                          Forgot password?
                        </a>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? 'Logging in...' : 'Login'}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={handleDevLogin}>
                      Quick Dev Login
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <form onSubmit={handleRegister}>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Enter your details to create a new account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Enter your full name" 
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerUsername">Username</Label>
                      <Input 
                        id="registerUsername" 
                        type="text" 
                        placeholder="Choose a username" 
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerPassword">Password</Label>
                      <Input 
                        id="registerPassword" 
                        type="password" 
                        placeholder="Create a password" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary/90">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:text-primary/90">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Column - Hero */}
      <div className="hidden lg:flex bg-gradient-to-br from-primary/90 to-primary flex-col justify-center p-8 text-white">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-6">Accelerate Your Growth Journey</h2>
          <p className="text-lg mb-12 text-white/90">
            A personalized platform to measure, track, and enhance your human potential across cognitive, emotional, physical, and social dimensions.
          </p>
          
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Driven Insights</h3>
                <p className="text-white/80">Personalized learning paths and assessments powered by advanced AI</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Collaborative Challenges</h3>
                <p className="text-white/80">Join the community in real-time growth challenges and activities</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track Your Progress</h3>
                <p className="text-white/80">Visualize improvements with detailed analytics and milestone tracking</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="h-5 w-5" />
              <h4 className="font-medium">Secure and Private</h4>
            </div>
            <p className="text-sm text-white/80">
              Your data is encrypted and never shared with third parties. HumanZ prioritizes your privacy and security on your growth journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}