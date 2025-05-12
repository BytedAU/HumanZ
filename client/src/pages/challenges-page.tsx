import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Plus,
  ArrowRight,
  RefreshCcw,
  ChevronDown,
  Star,
  Info,
  Flame,
  Trophy
} from "lucide-react";

// Mock challenge data
const ALL_CHALLENGES = [
  {
    id: 1,
    title: "San Francisco Social Explorer Challenge",
    description: "Explore the best networking spots in San Francisco and connect with new people weekly",
    category: "social",
    difficulty: "medium",
    participants: 68,
    durationDays: 30,
    startDate: new Date(2025, 4, 15),
    isCollaborative: true,
    progress: 35,
    status: "in-progress",
    imageUrl: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 2,
    title: "30-Day Meditation Challenge",
    description: "Build a consistent meditation practice with guided sessions and community support",
    category: "mindfulness",
    difficulty: "beginner",
    participants: 124,
    durationDays: 30,
    startDate: new Date(2025, 4, 10),
    isCollaborative: false,
    progress: 60,
    status: "in-progress",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 3,
    title: "Public Speaking Mastery",
    description: "Weekly speaking exercises with feedback from peers to improve your communication skills",
    category: "leadership",
    difficulty: "advanced",
    participants: 42,
    durationDays: 60,
    startDate: new Date(2025, 4, 5),
    isCollaborative: true,
    progress: 0,
    status: "not-started",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 4,
    title: "Creative Writing Sprint",
    description: "Write a short story in one month with daily prompts and peer review sessions",
    category: "creativity",
    difficulty: "intermediate",
    participants: 57,
    durationDays: 28,
    startDate: new Date(2025, 4, 20),
    isCollaborative: true,
    progress: 0,
    status: "upcoming",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 5,
    title: "Data Science Bootcamp",
    description: "Learn data analysis and visualization through real-world projects and peer collaboration",
    category: "education",
    difficulty: "advanced",
    participants: 38,
    durationDays: 45,
    startDate: new Date(2025, 4, 25),
    isCollaborative: true,
    progress: 0,
    status: "upcoming",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 6,
    title: "Morning Routine Challenge",
    description: "Build a productive morning routine with daily check-ins and accountability partners",
    category: "productivity",
    difficulty: "beginner",
    participants: 95,
    durationDays: 21,
    startDate: new Date(2025, 3, 15),
    isCollaborative: false,
    progress: 100,
    status: "completed",
    imageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 7,
    title: "Fitness Transformation Challenge",
    description: "A holistic 8-week fitness program with community support and progress tracking",
    category: "health",
    difficulty: "intermediate",
    participants: 112,
    durationDays: 56,
    startDate: new Date(2025, 5, 1),
    isCollaborative: true,
    progress: 0,
    status: "upcoming",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=500&h=300"
  },
  {
    id: 8,
    title: "Remote Work Productivity Bootcamp",
    description: "Master remote work with productivity systems, team collaboration tools, and work-life balance techniques",
    category: "productivity",
    difficulty: "intermediate",
    participants: 76,
    durationDays: 14,
    startDate: new Date(2025, 3, 1),
    isCollaborative: false,
    progress: 100,
    status: "completed",
    imageUrl: "https://images.unsplash.com/photo-1581472723648-909f4851d4ae?auto=format&fit=crop&q=80&w=500&h=300"
  }
];

// Mock active challenges (currently participating in)
const MY_ACTIVE_CHALLENGES = [
  ALL_CHALLENGES[0], // SF Social Explorer
  ALL_CHALLENGES[1]  // Meditation Challenge
];

// Mock past challenges
const MY_PAST_CHALLENGES = [
  ALL_CHALLENGES[5], // Morning Routine Challenge
  ALL_CHALLENGES[7]  // Remote Work Productivity
];

// Mock recommended challenges
const RECOMMENDED_CHALLENGES = [
  ALL_CHALLENGES[2], // Public Speaking
  ALL_CHALLENGES[4], // Data Science
  ALL_CHALLENGES[6]  // Fitness Transformation
];

// Function to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
};

// Define challenge type
interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  participants: number;
  durationDays: number;
  startDate: Date;
  isCollaborative: boolean;
  progress: number;
  status: string;
  imageUrl: string;
}

// Function to get badge colors by category
const getCategoryBadgeColor = (category: string): string => {
  const colors: Record<string, string> = {
    social: "bg-blue-500",
    mindfulness: "bg-purple-500",
    leadership: "bg-amber-500",
    creativity: "bg-green-500",
    education: "bg-cyan-500",
    productivity: "bg-indigo-500",
    health: "bg-rose-500"
  };
  
  return colors[category] || "bg-slate-500";
};

// Challenge card component
const ChallengeCard = ({ challenge, showProgress = true }: { challenge: Challenge; showProgress?: boolean }) => {
  return (
    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
      <div className="relative h-40 w-full">
        <img 
          src={challenge.imageUrl} 
          alt={challenge.title} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge className={`${getCategoryBadgeColor(challenge.category)} text-white border-none`}>
            {challenge.category}
          </Badge>
        </div>
        {challenge.isCollaborative && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-black/60 text-white border-none">
              <Users className="h-3 w-3 mr-1" /> Collaborative
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{challenge.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {challenge.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" /> 
            <span>Starts {formatDate(challenge.startDate)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" /> 
            <span>{challenge.durationDays} days</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-6 rounded-full bg-muted border border-background" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {challenge.participants} participants
          </span>
        </div>
        
        {showProgress && challenge.progress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Your progress</span>
              <span className="text-sm text-muted-foreground">{challenge.progress}%</span>
            </div>
            <Progress value={challenge.progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/challenges/${challenge.id}`}>
          <Button variant="outline" className="w-full">
            {challenge.status === "not-started" ? "Start Challenge" : 
             challenge.status === "in-progress" ? "Continue Challenge" :
             challenge.status === "upcoming" ? "Join Challenge" :
             "View Challenge"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [collaborativeOnly, setCollaborativeOnly] = useState(false);
  
  // Filter challenges based on active filters
  const filteredChallenges = ALL_CHALLENGES.filter(challenge => {
    const matchesSearch = 
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || challenge.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || challenge.difficulty === difficultyFilter;
    const matchesCollaborative = !collaborativeOnly || challenge.isCollaborative;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesCollaborative;
  });
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-10 px-4">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Growth Challenges</h1>
              <p className="text-lg mb-6 text-white/90">
                Join structured challenges to build skills, form habits, and connect with others on similar growth journeys.
              </p>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <Plus className="h-4 w-4 mr-2" /> Create Your Own Challenge
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="container-custom py-8">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
              <TabsList>
                <TabsTrigger value="all">All Challenges</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
                <TabsTrigger value="past">Past Challenges</TabsTrigger>
              </TabsList>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Challenge
              </Button>
            </div>
            
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search challenges..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="creativity">Creativity</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={difficultyFilter} 
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-8">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="collaborative" 
                  checked={collaborativeOnly}
                  onCheckedChange={(checked) => setCollaborativeOnly(checked === true)}
                />
                <Label htmlFor="collaborative" className="text-sm">Collaborative only</Label>
              </div>
              
              {(searchQuery || categoryFilter !== "all" || difficultyFilter !== "all" || collaborativeOnly) && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setDifficultyFilter("all");
                  setCollaborativeOnly(false);
                }}>
                  <RefreshCcw className="h-3 w-3 mr-1" /> Reset filters
                </Button>
              )}
            </div>
            
            {/* All Challenges Tab */}
            <TabsContent value="all">
              {filteredChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChallenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} showProgress={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-muted rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Info className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No matching challenges found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or create your own challenge</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Create Challenge
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Active Challenges Tab */}
            <TabsContent value="active">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Flame className="h-6 w-6 text-amber-500 mr-2" />
                    Active Challenges
                  </h2>
                  
                  {MY_ACTIVE_CHALLENGES.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {MY_ACTIVE_CHALLENGES.map(challenge => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">No active challenges</h3>
                      <p className="text-muted-foreground mb-6">Join a challenge to start tracking your progress</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Browse Challenges
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Trophy className="h-6 w-6 text-amber-500 mr-2" />
                    Featured Challenge
                  </h2>
                  
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="h-64 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200&h=400" 
                        alt="Leadership Masterclass Challenge" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <Badge className="bg-amber-500 text-white border-none mb-3">
                        Featured Challenge
                      </Badge>
                      <h2 className="text-2xl font-bold mb-2">Leadership Masterclass Challenge</h2>
                      <p className="mb-4 text-white/90 max-w-2xl">
                        A 6-week program to develop critical leadership skills through expert guidance, 
                        peer feedback, and practical exercises.
                      </p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" /> 
                          <span>156 participants</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" /> 
                          <span>Starts June 1, 2025</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" /> 
                          <span>4.9/5 rating</span>
                        </div>
                      </div>
                      <Button className="bg-white text-primary hover:bg-white/90">
                        Explore Challenge
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Recommended Challenges Tab */}
            <TabsContent value="recommended">
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 mr-2" />
                  Recommended Based on Your Profile
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {RECOMMENDED_CHALLENGES.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} showProgress={false} />
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">
                    View All Recommended <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Past Challenges Tab */}
            <TabsContent value="past">
              <div>
                <h2 className="text-2xl font-bold mb-6">Completed Challenges</h2>
                
                {MY_PAST_CHALLENGES.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MY_PAST_CHALLENGES.map(challenge => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">No completed challenges yet</h3>
                    <p className="text-muted-foreground mb-6">Join a challenge to start your growth journey</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Browse Challenges
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}