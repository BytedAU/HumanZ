import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Challenge, UserChallenge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar, Users } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChallengeList() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  
  // Fetch challenges
  const { 
    data: challenges = [], 
    isLoading: isLoadingChallenges 
  } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });
  
  // Fetch user challenges
  const { 
    data: userChallenges = [], 
    isLoading: isLoadingUserChallenges,
    refetch: refetchUserChallenges
  } = useQuery<UserChallenge[]>({
    queryKey: ["/api/user-challenges"],
  });
  
  // Check if user has joined a challenge
  const hasJoinedChallenge = (challengeId: number) => {
    return userChallenges.some(uc => uc.challengeId === challengeId);
  };
  
  // Join challenge
  const joinChallenge = async (challengeId: number) => {
    try {
      await apiRequest("POST", `/api/challenges/${challengeId}/join`);
      
      // Refetch user challenges
      queryClient.invalidateQueries({ queryKey: ["/api/user-challenges"] });
      
      toast({
        title: "Challenge joined!",
        description: "You have successfully joined the challenge.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter challenges
  const getFilteredChallenges = () => {
    if (filter === "joined") {
      const joinedChallengeIds = userChallenges.map(uc => uc.challengeId);
      return challenges.filter(c => joinedChallengeIds.includes(c.id));
    } else if (filter === "available") {
      const joinedChallengeIds = userChallenges.map(uc => uc.challengeId);
      return challenges.filter(c => !joinedChallengeIds.includes(c.id));
    }
    return challenges;
  };
  
  // Get category badge style
  const getCategoryStyle = (category: string) => {
    const categories = {
      educational: "bg-primary/10 text-primary",
      personal: "bg-blue-100 text-accent",
      career: "bg-green-100 text-secondary",
    };
    
    return categories[category.toLowerCase()] || "bg-gray-100 text-gray-800";
  };
  
  // Format duration
  const formatDuration = (days: number) => {
    if (days < 7) return `${days} days`;
    if (days === 7) return "1 week";
    if (days % 7 === 0) return `${days / 7} weeks`;
    if (days < 30) return `${Math.floor(days / 7)} weeks, ${days % 7} days`;
    if (days === 30) return "1 month";
    return `${Math.floor(days / 30)} months, ${Math.floor((days % 30) / 7)} weeks`;
  };
  
  // Get challenge image based on category
  const getChallengeImage = (category: string) => {
    const images = {
      educational: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      personal: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      career: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250"
    };
    
    return images[category.toLowerCase()] || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250";
  };
  
  // Sample participant count for demo (in a real app, this would come from the API)
  const getParticipantCount = (challengeId: number) => {
    return Math.floor(Math.random() * 40) + 10; // Random number between 10-50
  };
  
  // Get days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.max(0, differenceInDays(end, now));
  };
  
  const filteredChallenges = getFilteredChallenges();

  if (isLoadingChallenges || isLoadingUserChallenges) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Community Challenges</h2>
        <Select
          value={filter}
          onValueChange={setFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter challenges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Challenges</SelectItem>
            <SelectItem value="joined">Challenges I've Joined</SelectItem>
            <SelectItem value="available">Available Challenges</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredChallenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No challenges found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {filter === "joined" 
                ? "You haven't joined any challenges yet. Join a challenge to track your progress and compete with others."
                : "There are no challenges available at the moment. Check back later or create your own!"}
            </p>
            {filter === "joined" && (
              <Button onClick={() => setFilter("available")}>
                Browse Available Challenges
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => (
            <Card key={challenge.id} className="overflow-hidden shadow-soft hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={getChallengeImage(challenge.category)} 
                  alt={challenge.title} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant="outline" 
                    className={getCategoryStyle(challenge.category)}
                  >
                    {challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground font-normal">
                    <Calendar className="h-3 w-3 mr-1" />
                    {getDaysRemaining(challenge.endDate)} days left
                  </Badge>
                </div>
                
                <h3 className="text-xl font-medium text-foreground mb-2">{challenge.title}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">{challenge.description}</p>
                
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDuration(challenge.duration)} • {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>U1</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>U2</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>U3</AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getParticipantCount(challenge.id)} participants
                    </span>
                  </div>
                  
                  {hasJoinedChallenge(challenge.id) ? (
                    <Button variant="outline" className="text-primary border-primary" disabled>
                      Joined
                    </Button>
                  ) : (
                    <Button onClick={() => joinChallenge(challenge.id)}>
                      Join Challenge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
