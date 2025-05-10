import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Goal } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2, MoreVertical, Clock, Flame } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onUpdate: () => void;
}

export default function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'career':
        return "bg-blue-100 text-accent";
      case 'personal':
        return "bg-green-100 text-secondary";
      case 'educational':
        return "bg-purple-100 text-primary";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get priority icon and text
  const getPriorityDisplay = (priority: string) => {
    const levels = {
      high: { icon: <Flame className="h-4 w-4 mr-1 text-red-500" />, text: "High priority" },
      medium: { icon: <Flame className="h-4 w-4 mr-1 text-amber-500" />, text: "Medium priority" },
      low: { icon: <Flame className="h-4 w-4 mr-1 text-green-500" />, text: "Low priority" }
    };
    
    return levels[priority.toLowerCase()] || levels.medium;
  };
  
  // Format deadline
  const formatDeadline = (deadline: string | Date | null | undefined) => {
    if (!deadline) return 'No deadline';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks left`;
    
    return format(deadlineDate, 'MMM d, yyyy');
  };
  
  // Toggle completion status
  const toggleCompletionStatus = async () => {
    try {
      setIsUpdating(true);
      await apiRequest("PUT", `/api/goals/${goal.id}`, {
        isCompleted: !goal.isCompleted,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      onUpdate();
      
      toast({
        title: goal.isCompleted ? "Goal marked as incomplete" : "Goal completed! 🎉",
        description: goal.isCompleted 
          ? "You can continue working on this goal" 
          : "Congratulations on achieving your goal!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Delete goal
  const deleteGoal = async () => {
    try {
      setIsDeleting(true);
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      onUpdate();
      
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge 
              className={cn("mb-2 font-normal", getCategoryColor(goal.category))}
              variant="outline"
            >
              {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
            </Badge>
            <h3 className="text-lg font-medium text-foreground">{goal.title}</h3>
          </div>
          <div className="flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Goal Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleCompletionStatus}>
                  {goal.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                </DropdownMenuItem>
                <DropdownMenuItem>Edit goal</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={deleteGoal}
                >
                  Delete goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {goal.description && (
          <p className="text-muted-foreground mb-4 flex-grow">{goal.description}</p>
        )}
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-foreground">{goal.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-value" 
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm mt-4">
          <span className="text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" /> {formatDeadline(goal.deadline)}
          </span>
          <span className="text-muted-foreground flex items-center">
            {getPriorityDisplay(goal.priority).icon}
            {getPriorityDisplay(goal.priority).text}
          </span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <Button 
            variant={goal.isCompleted ? "outline" : "default"} 
            className="w-full"
            onClick={toggleCompletionStatus}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : goal.isCompleted ? (
              "Completed ✓"
            ) : (
              "Mark as Complete"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
