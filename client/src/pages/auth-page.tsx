import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      bio: "",
      avatar: "",
    },
  });
  
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword as it's not expected by the API
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 items-center">
          {/* Hero Section */}
          <div className="text-center md:text-left">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Unlock Your Human Potential
              </h1>
              <p className="text-xl text-muted-foreground">
                HumanZ combines AI-powered assessment with community engagement to help you track and enhance your personal growth journey.
              </p>
              <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800&q=80" 
                    alt="Team working together on growth journey" 
                    className="w-full h-auto" 
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-foreground">AI-powered assessment and goal-setting</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-foreground">Track your weekly growth and progress</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-foreground">Join community challenges and leaderboards</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Auth Forms */}
          <div>
            <Card className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">Welcome Back</h2>
                      <p className="text-muted-foreground mt-2">Sign in to continue your growth journey</p>
                    </div>
                    
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing In...
                            </>
                          ) : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">Create Account</h2>
                      <p className="text-muted-foreground mt-2">Join HumanZ and start your growth journey</p>
                    </div>
                    
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container-custom">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} HumanZ. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
