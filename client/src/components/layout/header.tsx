import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth0 } from "@/hooks/use-auth0";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Menu, 
  Bell, 
  LogOut, 
  User,
  Settings,
  Crown
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, loginWithRedirect } = useAuth0();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get user's initials for Avatar fallback
  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Goals", href: "/goals" },
    { name: "Community", href: "/community" },
    { name: "Analytics", href: "/analytics" },
  ];
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };
  
  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: location },
    });
  };

  return (
    <header className="bg-white border-b border-border">
      <div className="container-custom">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="text-primary font-bold text-2xl flex items-center">
                  HumanZ
                  {/* You could add a logo SVG here */}
                </a>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive(item.href)
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User menu and mobile menu button */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex sm:items-center">
                  <button className="p-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" />
                  </button>
                  
                  <div className="ml-4 relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                          <span className="sr-only">Open user menu</span>
                          <Avatar>
                            <AvatarImage src={user?.picture || ""} alt={user?.name || "User"} />
                            <AvatarFallback>{getInitials()}</AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Mobile menu button */}
                <div className="sm:hidden">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <div className="flex flex-col space-y-4 py-4">
                        <div className="flex items-center mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.picture || ""} alt={user?.name || "User"} />
                            <AvatarFallback>{getInitials()}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                        
                        <nav className="grid gap-2">
                          {navItems.map((item) => (
                            <Link key={item.name} href={item.href}>
                              <a
                                className={`block px-3 py-2 rounded-md text-base font-medium ${
                                  isActive(item.href)
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-muted"
                                }`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {item.name}
                              </a>
                            </Link>
                          ))}
                        </nav>
                        
                        <div className="mt-auto">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => {
                              handleLogout();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <Button 
                variant="default" 
                onClick={handleLogin}
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
