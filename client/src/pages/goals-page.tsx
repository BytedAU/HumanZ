import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import SiteFooter from "@/components/layout/site-footer";
import GoalCard from "@/components/dashboard/goal-card";
import GoalForm from "@/components/goals/goal-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Search, Filter, Plus, Target } from "lucide-react";

export default function GoalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Fetch goals
  const { 
    data: goals = [], 
    isLoading, 
    refetch: refetchGoals 
  } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  // Filter goals
  const filteredGoals = goals.filter(goal => {
    // Search filter
    if (searchQuery && !goal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== "all" && goal.category !== categoryFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter === "completed" && !goal.isCompleted) {
      return false;
    }
    if (statusFilter === "incomplete" && goal.isCompleted) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== "all" && goal.priority !== priorityFilter) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0" />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Goals</h1>
                <p className="text-muted-foreground">
                  Set, track, and achieve your personal growth goals
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <GoalForm onGoalCreated={refetchGoals} />
              </div>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-soft p-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="text-sm">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Category</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="text-sm">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="text-sm">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Priority</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Goal tabs */}
            <Tabs defaultValue="grid" className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>
                
                <div className="text-sm text-muted-foreground">
                  Showing {filteredGoals.length} of {goals.length} goals
                </div>
              </div>
              
              <TabsContent value="grid">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No goals found</h3>
                    <p className="text-muted-foreground mb-6">
                      {goals.length === 0 
                        ? "You haven't created any goals yet. Create your first goal to start tracking your progress."
                        : "No goals match your current filters. Try adjusting your search criteria."}
                    </p>
                    {goals.length === 0 ? (
                      <GoalForm onGoalCreated={refetchGoals} />
                    ) : (
                      <Button variant="outline" onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("all");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} onUpdate={refetchGoals} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="list">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No goals found</h3>
                    <p className="text-muted-foreground mb-6">
                      {goals.length === 0 
                        ? "You haven't created any goals yet. Create your first goal to start tracking your progress."
                        : "No goals match your current filters. Try adjusting your search criteria."}
                    </p>
                    {goals.length === 0 ? (
                      <GoalForm onGoalCreated={refetchGoals} />
                    ) : (
                      <Button variant="outline" onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("all");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progress</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredGoals.map((goal) => (
                            <tr key={goal.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium">{goal.title}</td>
                              <td className="px-4 py-3 capitalize">{goal.category}</td>
                              <td className="px-4 py-3 capitalize">{goal.priority}</td>
                              <td className="px-4 py-3">
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-secondary" 
                                    style={{ width: `${goal.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">{goal.progress}%</span>
                              </td>
                              <td className="px-4 py-3">
                                {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  goal.isCompleted 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {goal.isCompleted ? 'Completed' : 'In Progress'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Edit functionality would go here
                                  }}
                                >
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <SiteFooter />
      </div>
    </div>
  );
}
