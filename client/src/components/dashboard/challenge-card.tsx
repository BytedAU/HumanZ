import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChallengeCardProps {
  userChallenge: {
    id: number;
    userId: number;
    challengeId: number;
    progress: number;
    isCompleted: boolean;
    joinedAt: string;
    challenge: {
      id: number;
      title: string;
      description: string;
      category: string;
      duration: number;
      startDate: string;
      endDate: string;
      createdBy: number;
      createdAt: string;
    };
  };
  onUpdate: () => void;
}

export default function ChallengeCard({ userChallenge, onUpdate }: ChallengeCardProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(userChallenge.progress);
  const [isUpdating, setIsUpdating] = useState(false);
  const challenge = userChallenge.challenge;
  
  // Sample participant avatars (in a real app, this would come from the API)
  const participants = [
    "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
  ];
  
  // Get category style
  const getCategoryStyle = (category: string) => {
    const categories = {
      educational: "bg-primary/10 text-primary",
      personal: "bg-blue-100 text-accent",
      career: "bg-green-100 text-secondary",
    };
    
    return categories[category.toLowerCase()] || "bg-gray-100 text-gray-800";
  };
  
  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };
  
  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Ended";
    if (diffDays === 0) return "Ends today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };
  
  // Update challenge progress
  const updateProgress = async () => {
    try {
      if (progress === userChallenge.progress) return;
      
      setIsUpdating(true);
      await apiRequest("PUT", `/api/user-challenges/${userChallenge.id}`, {
        progress: progress,
        isCompleted: progress === 100
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user-challenges"] });
      onUpdate();
      
      toast({
        title: progress === 100 ? "Challenge completed! 🎉" : "Progress updated",
        description: progress === 100 
          ? "Congratulations on completing the challenge!" 
          : `Your progress has been updated to ${progress}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
      setProgress(userChallenge.progress);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get challenge image based on category
  const getChallengeImage = (category: string) => {
    const images = {
      educational: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      personal: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250"
    };
    
    return images[category.toLowerCase()] || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250";
  };

  return (
    <Card className="shadow-soft hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="md:flex items-start">
          <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
            <img 
              src={getChallengeImage(challenge.category)} 
              alt={challenge.title} 
              className="rounded-lg w-full h-40 object-cover"
            />
          </div>
          <div className="md:w-2/3">
            <div className="flex items-center justify-between mb-2">
              <Badge 
                variant="outline" 
                className={getCategoryStyle(challenge.category)}
              >
                {challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)} Challenge
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {getDaysRemaining(challenge.endDate)}
              </span>
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">{challenge.title}</h3>
            <p className="text-muted-foreground mb-4">{challenge.description}</p>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Duration: {challenge.duration} days ({formatDateRange(challenge.startDate, challenge.endDate)})
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Slider
                value={[progress]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setProgress(value[0])}
                onValueCommit={updateProgress}
                disabled={isUpdating || userChallenge.isCompleted}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {participants.map((src, i) => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={src} />
                    <AvatarFallback>U{i+1}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{Math.floor(Math.random() * 40) + 10}
                </div>
              </div>
              <div>
                {userChallenge.isCompleted ? (
                  <Button variant="outline" className="text-secondary">
                    Challenge Completed ✓
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setProgress(100);
                      updateProgress();
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Complete Challenge"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
