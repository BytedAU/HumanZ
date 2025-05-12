import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
// import { useAuth } from "@/hooks/use-auth";

interface LeaderboardUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  growth: number;
  category: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  userPosition?: {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    growth: number;
    category: string;
    position: number;
  };
}

interface LeaderboardProps {
  data?: LeaderboardData;
  isLoading: boolean;
}

export default function Leaderboard({ data, isLoading }: LeaderboardProps) {
  // Mock user for development
  const user = {
    id: 1,
    name: "Demo User",
    avatar: null,
    email: "demo@example.com"
  };
  const [timeframe, setTimeframe] = useState<string>("week");
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get category label
  const getCategoryLabel = (category: string) => {
    const categories = {
      leadership: "Leadership Expert",
      data_science: "Data Scientist",
      creative: "Creative Director",
      product: "Product Manager",
      design: "UX Designer",
      software: "Software Engineer",
    };
    
    return categories[category] || "Growth Expert";
  };

  return (
    <Card className="shadow-soft h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medium text-lg">Weekly Growth Champions</CardTitle>
          <div className="relative">
            <Select
              value={timeframe}
              onValueChange={setTimeframe}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="This Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="alltime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-0 pb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top user */}
            {data?.leaderboard && data.leaderboard.length > 0 && (
              <div className="flex items-center p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold mr-3">1</div>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage 
                    src={data.leaderboard[0].avatar || ""} 
                    alt={data.leaderboard[0].name} 
                  />
                  <AvatarFallback>{getInitials(data.leaderboard[0].name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-foreground font-medium">{data.leaderboard[0].name}</h4>
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(data.leaderboard[0].category)}</p>
                </div>
                <span className="font-bold text-primary">+{data.leaderboard[0].growth}%</span>
              </div>
            )}
            
            {/* Other users */}
            {data?.leaderboard && data.leaderboard.slice(1).map((user, index) => (
              <div key={user.id} className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-foreground text-sm font-bold mr-3">
                  {index + 2}
                </div>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-foreground font-medium">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(user.category)}</p>
                </div>
                <span className="font-bold text-primary">+{user.growth}%</span>
              </div>
            ))}
            
            {/* Current user position */}
            {data?.userPosition && (
              <div className="flex items-center p-3 bg-muted border border-dashed border-primary rounded-lg">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white text-sm font-bold mr-3">
                  {data.userPosition.position}
                </div>
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "You"} />
                  <AvatarFallback>{user ? getInitials(user.name) : "You"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="text-foreground font-medium">You</h4>
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(data.userPosition.category)}</p>
                </div>
                <span className="font-bold text-primary">+{data.userPosition.growth}%</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6">
          <Button variant="outline" className="w-full text-primary">
            View Full Leaderboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
