import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/layout/site-footer";
import StatsCard from "@/components/dashboard/stats-card";
import GoalCard from "@/components/dashboard/goal-card";
import WeeklyProgressChart from "@/components/dashboard/weekly-progress-chart";
import Leaderboard from "@/components/dashboard/leaderboard";
import ChallengeCard from "@/components/dashboard/challenge-card";
// Auth hook temporarily removed
// import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Sliders, Flame, Brain, Book, Users, Lightbulb } from "lucide-react";
import { Goal, UserChallenge } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardPage() {
  // Mock user for development
  const user = {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    isPremium: false
  };
  
  // Fetch goals
  const { 
    data: goals = [], 
    isLoading: isLoadingGoals,
    refetch: refetchGoals
  } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });
  
  // Fetch user challenges
  const { 
    data: userChallenges = [], 
    isLoading: isLoadingChallenges,
    refetch: refetchChallenges
  } = useQuery<UserChallenge[]>({
    queryKey: ["/api/user-challenges"],
  });
  
  // Type for leaderboard data
  interface LeaderboardData {
    id: number;
    name: string;
    avatar: string | null;
    points: number;
    rank: number;
  }
  
  // Fetch leaderboard data
  const { 
    data: leaderboardData, 
    isLoading: isLoadingLeaderboard 
  } = useQuery<LeaderboardData[]>({
    queryKey: ["/api/leaderboard"],
  });
  
  // Record daily growth automatically for demo purposes
  useEffect(() => {
    const recordGrowth = async () => {
      try {
        // Only record growth if user exists and they don't have any goals yet
        // This is just to populate some initial data for the demo
        if (user && goals.length === 0) {
          const today = new Date();
          await apiRequest("POST", "/api/growth", {
            date: today.toISOString(),
            value: 12, // random growth value
            category: "overall"
          });
        }
      } catch (error) {
        console.error("Failed to record growth:", error);
      }
    };
    
    recordGrowth();
  }, [user, goals.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="hero-gradient text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="container-custom">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 animate-fade-in">
                <h1 className="text-4xl font-bold mb-6">Unlock Your Human Potential</h1>
                <p className="text-xl mb-8">HumanZ combines AI-powered assessment with community engagement to help you track and enhance your personal growth journey.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Take Assessment
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center animate-slide-up">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400"
                  alt="Professional team collaborating on growth strategies"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="container-custom py-12">
          {/* Stats Overview */}
          <div className="mb-12">
            <h2 className="section-title">Your Growth Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weekly Growth */}
              <StatsCard
                title="Weekly Growth"
                value="+12%"
                description="You're growing 5% faster than last week."
              >
                <WeeklyProgressChart />
              </StatsCard>
              
              {/* Goal Completion */}
              <StatsCard
                title="Goal Completion"
                value={`${Math.round((goals.filter(g => g.isCompleted).length / (goals.length || 1)) * 100)}%`}
                description={`You've completed ${goals.filter(g => g.isCompleted).length} of ${goals.length} goals this month.`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Educational</span>
                      <span className="text-sm font-medium text-muted-foreground">80%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-value" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Career</span>
                      <span className="text-sm font-medium text-muted-foreground">65%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-value" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Personal</span>
                      <span className="text-sm font-medium text-muted-foreground">90%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-value" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                </div>
              </StatsCard>
              
              {/* Weekly Focus */}
              <StatsCard
                title="Weekly Focus"
                action={
                  <Button variant="ghost" size="sm" className="text-primary">
                    <Sliders className="h-4 w-4 mr-1" /> Adjust
                  </Button>
                }
                description="AI recommendations for your growth."
              >
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="bg-green-100 text-secondary p-2 rounded-full mr-3">
                      <Brain className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">Complete cognitive skills assessment</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-100 text-accent p-2 rounded-full mr-3">
                      <Book className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">Read 2 chapters on leadership</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-purple-100 text-primary p-2 rounded-full mr-3">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">Join the weekly community challenge</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full mr-3">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">Practice creative thinking exercises</span>
                  </li>
                </ul>
              </StatsCard>
            </div>
          </div>
          
          {/* Current Goals */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="section-title">Current Goals</h2>
              <Link href="/goals">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Goal
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingGoals ? (
                <p>Loading goals...</p>
              ) : goals.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                  <p className="text-muted-foreground mb-4">Set your first goal to start tracking your progress</p>
                  <Link href="/goals">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
                    </Button>
                  </Link>
                </div>
              ) : (
                goals.slice(0, 3).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={refetchGoals} />
                ))
              )}
              
              {goals.length > 0 && goals.length > 3 && (
                <div className="lg:col-span-3 flex justify-center mt-4">
                  <Link href="/goals">
                    <Button variant="outline">
                      View All Goals <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Community & Challenges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="section-title">Active Challenges</h2>
                <Link href="/community">
                  <Button variant="link" className="text-primary">View All Challenges</Button>
                </Link>
              </div>
              
              <div className="space-y-6">
                {isLoadingChallenges ? (
                  <p>Loading challenges...</p>
                ) : userChallenges.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-soft">
                    <h3 className="text-lg font-medium mb-2">No active challenges</h3>
                    <p className="text-muted-foreground mb-4">Join a challenge to boost your growth and connect with others</p>
                    <Link href="/community">
                      <Button>
                        Browse Challenges
                      </Button>
                    </Link>
                  </div>
                ) : (
                  userChallenges.slice(0, 2).map((userChallenge: any) => (
                    <ChallengeCard 
                      key={userChallenge.id} 
                      userChallenge={userChallenge} 
                      onUpdate={refetchChallenges} 
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Leaderboard */}
            <div>
              <h2 className="section-title">Leaderboard</h2>
              <Leaderboard data={leaderboardData || []} isLoading={isLoadingLeaderboard} />
            </div>
          </div>
          
          {/* Premium Features */}
          {!user?.isPremium && (
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-8 mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">Unlock Premium Analytics</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">Get deeper insights into your growth patterns, personalized AI recommendations, and advanced tracking tools.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-white rounded-xl shadow-soft p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">Deep dive into your growth patterns with interactive charts and visualizations.</p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-white rounded-xl shadow-soft p-6 text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">AI Growth Coach</h3>
                  <p className="text-muted-foreground">Get personalized recommendations and insights tailored to your goals.</p>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-white rounded-xl shadow-soft p-6 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Goal Optimization</h3>
                  <p className="text-muted-foreground">Advanced goal setting tools with milestone tracking and prediction algorithms.</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button size="lg" className="shadow-md hover:shadow-lg transition-all hover:translate-y-[-2px]">
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
