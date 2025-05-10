import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Gauge,
  Target,
  Users,
  BarChart3,
  Brain,
  Award,
  LogOut,
  ArrowRight,
  Crown,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation, upgradeToPremimuMutation } = useAuth();
  
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
  
  const menuItems = [
    { name: "Dashboard", href: "/", icon: <Gauge className="h-5 w-5" /> },
    { name: "Goals", href: "/goals", icon: <Target className="h-5 w-5" /> },
    { name: "Community", href: "/community", icon: <Users className="h-5 w-5" /> },
    { name: "Analytics", href: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  ];
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleUpgrade = () => {
    upgradeToPremimuMutation.mutate();
  };

  return (
    <div className={cn("flex flex-col h-screen bg-white border-r border-border", className)}>
      {/* Logo */}
      <div className="p-6">
        <Link href="/">
          <a className="flex items-center text-primary font-bold text-2xl space-x-1">
            <span>HumanZ</span>
          </a>
        </Link>
      </div>
      
      {/* User profile */}
      <div className="px-6 py-4 border-y border-border">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        
        {/* Premium badge or upgrade button */}
        {user?.isPremium ? (
          <div className="mt-3 flex items-center text-amber-500 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium">
            <Crown className="h-3 w-3 mr-1" />
            Premium Member
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full text-xs"
            onClick={handleUpgrade}
            disabled={upgradeToPremimuMutation.isPending}
          >
            <Crown className="h-3 w-3 mr-1" />
            Upgrade to Premium
          </Button>
        )}
      </div>
      
      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {isActive(item.href) && (
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Assessments
          </h3>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/assessments/leadership">
                <a className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Brain className="h-5 w-5 mr-3" />
                  Leadership Skills
                </a>
              </Link>
            </li>
            <li>
              <Link href="/assessments/emotional-intelligence">
                <a className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Award className="h-5 w-5 mr-3" />
                  Emotional Intelligence
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </Button>
      </div>
    </div>
  );
}
