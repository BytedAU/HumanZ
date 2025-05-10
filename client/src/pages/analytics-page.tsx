import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import SiteFooter from "@/components/layout/site-footer";
import GrowthChart from "@/components/analytics/growth-chart";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
} from "recharts";
import { Brain, Calendar, Download, Lock, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Crown } from "lucide-react";

export default function AnalyticsPage() {
  const { user, upgradeToPremimuMutation } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("growth");
  
  // Fetch insights
  const { data: growthInsights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ["/api/insights/growth"],
    enabled: user?.isPremium || false,
  });
  
  // Fetch user assessments
  const { data: userAssessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["/api/user-assessments"],
  });
  
  // Fetch goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery({
    queryKey: ["/api/goals"],
  });
  
  // Prepare categories data for pie chart
  const prepareCategoriesData = () => {
    if (!goals || goals.length === 0) {
      return [
        { name: "Personal", value: 33 },
        { name: "Career", value: 33 },
        { name: "Educational", value: 34 },
      ];
    }
    
    const categories = {
      personal: 0,
      career: 0,
      educational: 0,
    };
    
    goals.forEach((goal) => {
      if (categories[goal.category.toLowerCase()] !== undefined) {
        categories[goal.category.toLowerCase()]++;
      }
    });
    
    return [
      { name: "Personal", value: categories.personal || 1 },
      { name: "Career", value: categories.career || 1 },
      { name: "Educational", value: categories.educational || 1 },
    ];
  };
  
  // Prepare assessment data for radar chart
  const prepareAssessmentData = () => {
    if (!userAssessments || userAssessments.length === 0) {
      return [
        { subject: "Leadership", score: 78 },
        { subject: "Emotional Intelligence", score: 72 },
        { subject: "Problem Solving", score: 84 },
        { subject: "Communication", score: 68 },
        { subject: "Creativity", score: 89 },
      ];
    }
    
    const categoryScores = {};
    userAssessments.forEach((assessment) => {
      const category = assessment.results.category || "General";
      categoryScores[category] = assessment.score;
    });
    
    return Object.entries(categoryScores).map(([subject, score]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1).replace("_", " "),
      score,
    }));
  };
  
  // Sample categories data for pie chart
  const categoriesData = prepareCategoriesData();
  
  // Sample assessment data for radar chart
  const assessmentData = prepareAssessmentData();
  
  // Sample productivity data for line chart
  const productivityData = [
    { day: "Mon", amount: 65 },
    { day: "Tue", amount: 72 },
    { day: "Wed", amount: 58 },
    { day: "Thu", amount: 75 },
    { day: "Fri", amount: 82 },
    { day: "Sat", amount: 68 },
    { day: "Sun", amount: 70 },
  ];
  
  // Sample weekly focus data for bar chart
  const focusData = [
    { category: "Reading", hours: 4.5 },
    { category: "Projects", hours: 7.2 },
    { category: "Learning", hours: 5.8 },
    { category: "Exercise", hours: 2.5 },
    { category: "Meditation", hours: 1.2 },
  ];
  
  // Colors for pie chart
  const COLORS = ["#7C3AED", "#10B981", "#60A5FA", "#EC4899", "#F59E0B"];
  
  // Handle upgrade click
  const handleUpgrade = () => {
    upgradeToPremimuMutation.mutate();
  };

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
                <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
                <p className="text-muted-foreground">
                  Track your growth metrics and get personalized insights
                </p>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0">
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="hidden sm:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-3 md:w-[400px]">
                <TabsTrigger value="growth" className="flex items-center">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Growth
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Assessments
                </TabsTrigger>
              </TabsList>
              
              {/* Growth Analytics Tab */}
              <TabsContent value="growth" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">78</CardTitle>
                      <CardDescription>Current Growth Score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-secondary flex items-center">
                        <span className="mr-1">↑</span> 12% from last {timeRange}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">5</CardTitle>
                      <CardDescription>Active Goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-secondary flex items-center">
                        <span className="mr-1">↑</span> 2 completed this {timeRange}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">3</CardTitle>
                      <CardDescription>Assessments Taken</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-secondary flex items-center">
                        <span className="mr-1">↑</span> 1 new this {timeRange}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <GrowthChart title="Growth Over Time" />
                  
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Weekly Productivity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={productivityData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <YAxis 
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="hsl(var(--primary))" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                
                {user?.isPremium ? (
                  <Card className="shadow-soft overflow-hidden">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-lg font-medium flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-primary" />
                        AI Growth Insights
                      </CardTitle>
                      <CardDescription>
                        Personalized AI analysis of your growth patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isLoadingInsights ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <h3 className="text-lg font-medium mb-3">Key Trends</h3>
                            <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                              {growthInsights?.trends?.map((trend, index) => (
                                <li key={index}>{trend}</li>
                              )) || (
                                <>
                                  <li>Overall positive growth trajectory</li>
                                  <li>Strongest growth in educational areas</li>
                                </>
                              )}
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-3">Growth Patterns</h3>
                            <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                              {growthInsights?.patterns?.map((pattern, index) => (
                                <li key={index}>{pattern}</li>
                              )) || (
                                <>
                                  <li>Higher growth on weekends</li>
                                  <li>Periods of plateau followed by sharp improvements</li>
                                </>
                              )}
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                            <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                              {growthInsights?.recommendations?.map((recommendation, index) => (
                                <li key={index}>{recommendation}</li>
                              )) || (
                                <>
                                  <li>Focus more on consistent daily progress</li>
                                  <li>Balance growth across all categories</li>
                                  <li>Set specific weekly targets</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-soft overflow-hidden">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-lg font-medium flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        Premium Analytics
                      </CardTitle>
                      <CardDescription>
                        Unlock advanced AI-powered insights with a premium subscription
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <Brain className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-medium mb-2">AI Growth Patterns</h3>
                          <p className="text-sm text-muted-foreground">
                            Get personalized analysis of your growth patterns and trends
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                            <BarChart3 className="h-6 w-6 text-secondary" />
                          </div>
                          <h3 className="font-medium mb-2">Advanced Metrics</h3>
                          <p className="text-sm text-muted-foreground">
                            Access detailed analytics across all your growth dimensions
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3">
                            <Calendar className="h-6 w-6 text-accent" />
                          </div>
                          <h3 className="font-medium mb-2">Predictive Planning</h3>
                          <p className="text-sm text-muted-foreground">
                            See AI projections of your future growth based on current patterns
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <Button 
                          onClick={handleUpgrade}
                          className="px-8"
                          disabled={upgradeToPremimuMutation.isPending}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          {upgradeToPremimuMutation.isPending ? "Upgrading..." : "Upgrade to Premium"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Goals Analytics Tab */}
              <TabsContent value="goals" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Goals by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoriesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoriesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Weekly Focus Areas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={focusData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis 
                            dataKey="category" 
                            type="category" 
                            tick={{ fontSize: 12 }} 
                            width={100}
                          />
                          <Tooltip />
                          <Bar 
                            dataKey="hours" 
                            fill="hsl(var(--secondary))" 
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Goal Completion Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {isLoadingGoals ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                      </div>
                    ) : goals && goals.length > 0 ? (
                      <div className="space-y-4">
                        {goals.slice(0, 5).map((goal) => (
                          <div key={goal.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{goal.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{goal.progress}% complete</span>
                              <span className="capitalize">{goal.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <BarChart3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No goals found</h3>
                        <p className="text-muted-foreground mb-4">
                          You haven't created any goals yet. Create your first goal to track your progress.
                        </p>
                        <Button>Create Your First Goal</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Assessments Analytics Tab */}
              <TabsContent value="assessments" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">78</CardTitle>
                      <CardDescription>Latest Assessment Score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-secondary flex items-center">
                        <span className="mr-1">↑</span> 5 points from previous
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">3</CardTitle>
                      <CardDescription>Assessments Completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Out of 5 available assessments
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">Leadership</CardTitle>
                      <CardDescription>Strongest Category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-secondary flex items-center">
                        <span className="mr-1">↑</span> 84/100 score
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Skills Assessment Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {isLoadingAssessments ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={150} data={assessmentData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Skills"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                {userAssessments && userAssessments.length > 0 ? (
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Assessment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userAssessments.map((assessment) => (
                          <div key={assessment.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{assessment.results.title || `Assessment #${assessment.id}`}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(assessment.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${assessment.score}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{assessment.score}/100 points</span>
                              <Button variant="link" className="h-auto p-0 text-xs">View Details</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Assessment Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg border border-muted hover:border-primary transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Leadership Potential Assessment</h4>
                              <p className="text-sm text-muted-foreground mb-2">Evaluate your leadership style and discover growth opportunities.</p>
                            </div>
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">20 min</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              <Users className="h-4 w-4 inline mr-1" /> 1,248 completions
                            </span>
                            <Button variant="link" className="p-0 h-auto">Take Assessment</Button>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-lg border border-muted hover:border-primary transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Emotional Intelligence Evaluation</h4>
                              <p className="text-sm text-muted-foreground mb-2">Understand your emotional awareness and relationship management skills.</p>
                            </div>
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">25 min</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              <Users className="h-4 w-4 inline mr-1" /> 1,879 completions
                            </span>
                            <Button variant="link" className="p-0 h-auto">Take Assessment</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
