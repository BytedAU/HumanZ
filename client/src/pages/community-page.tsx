import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Star, 
  Search, 
  Filter, 
  Plus, 
  ArrowUpRight, 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  UserPlus,
  Flag
} from "lucide-react";
import { Challenge, UserChallenge } from "@shared/schema";
import { mockLeaderboardData, LeaderboardData } from "@/lib/mock-data";

// Mock data for challenges
const mockChallenges = [
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
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=500&h=300"
  }
];

// Mock data for forums/discussions
const mockDiscussions = [
  {
    id: 1,
    title: "Best strategies for balancing work and personal growth?",
    author: {
      id: 101,
      name: "Emma Johnson",
      avatar: null
    },
    replies: 24,
    likes: 47,
    lastActivity: new Date(2025, 4, 18),
    tags: ["work-life", "productivity", "balance"]
  },
  {
    id: 2,
    title: "Has anyone tried the 5AM club routine? Is it worth it?",
    author: {
      id: 102,
      name: "Michael Chen",
      avatar: null
    },
    replies: 35,
    likes: 62,
    lastActivity: new Date(2025, 4, 17),
    tags: ["morning-routine", "habits", "productivity"]
  },
  {
    id: 3,
    title: "Looking for accountability partner for programming learning path",
    author: {
      id: 103,
      name: "Jessica Miller",
      avatar: null
    },
    replies: 18,
    likes: 31,
    lastActivity: new Date(2025, 4, 16),
    tags: ["learning", "programming", "accountability"]
  }
];

// Mock data for group activities
const mockGroupActivities = [
  {
    id: 1,
    title: "Weekly Virtual Book Club",
    description: "Discussing 'Atomic Habits' by James Clear this week",
    members: 32,
    date: new Date(2025, 4, 23),
    time: "7:00 PM PST",
    type: "recurring",
    category: "learning"
  },
  {
    id: 2,
    title: "Problem-Solving Workshop",
    description: "Interactive session on creative problem-solving techniques",
    members: 18,
    date: new Date(2025, 4, 25),
    time: "5:30 PM PST",
    type: "one-time",
    category: "skills"
  },
  {
    id: 3,
    title: "Networking Mixer for Tech Professionals",
    description: "Connect with other professionals in tech and adjacent fields",
    members: 45,
    date: new Date(2025, 4, 30),
    time: "6:00 PM PST",
    type: "one-time",
    category: "networking"
  }
];

// Function to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
};

// Get initials for avatar fallback
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("challenges");
  const [searchQuery, setSearchQuery] = useState("");
  
  // We're using mock data directly since we're bypassing authentication
  const challenges = mockChallenges;
  const discussions = mockDiscussions;
  const groupActivities = mockGroupActivities;
  const leaderboardData = mockLeaderboardData;
  
  // Filter challenges based on search query
  const filteredChallenges = challenges.filter(challenge => 
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter discussions based on search query
  const filteredDiscussions = discussions.filter(discussion => 
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Filter group activities based on search query
  const filteredActivities = groupActivities.filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 px-4">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Connect and Grow Together</h1>
              <p className="text-lg mb-8 text-white/90">
                Join challenges, participate in discussions, and connect with like-minded people committed to personal growth.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Plus className="h-4 w-4 mr-2" /> Create Challenge
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <UserPlus className="h-4 w-4 mr-2" /> Find Peers
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container-custom py-8">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search challenges, discussions, or activities..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
              <Button className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" /> Create New
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsList className="grid grid-cols-4 mb-8 w-full md:w-auto">
              <TabsTrigger value="challenges" className="flex gap-2 items-center">
                <Flag className="h-4 w-4" />
                <span className="hidden md:inline">Challenges</span>
              </TabsTrigger>
              <TabsTrigger value="discussions" className="flex gap-2 items-center">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline">Discussions</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex gap-2 items-center">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Groups</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex gap-2 items-center">
                <Trophy className="h-4 w-4" />
                <span className="hidden md:inline">Leaderboard</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Challenges Tab */}
            <TabsContent value="challenges">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map(challenge => (
                  <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative h-40 w-full">
                        <img 
                          src={challenge.imageUrl} 
                          alt={challenge.title} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className={`
                            ${challenge.category === "social" ? "bg-blue-500" : ""}
                            ${challenge.category === "mindfulness" ? "bg-purple-500" : ""}
                            ${challenge.category === "leadership" ? "bg-amber-500" : ""}
                            ${challenge.category === "creativity" ? "bg-green-500" : ""}
                            text-white border-none
                          `}>
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
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button variant="outline" className="w-full">
                          View Challenge
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
              {filteredChallenges.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No matching challenges found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your search or create a new challenge</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Create Challenge
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Discussions Tab */}
            <TabsContent value="discussions">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Community Discussions</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> New Topic
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredDiscussions.map(discussion => (
                      <Card key={discussion.id} className="hover:shadow-sm transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex gap-3 items-center">
                              <Avatar>
                                <AvatarImage src={discussion.author.avatar || ""} />
                                <AvatarFallback>{getInitials(discussion.author.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{discussion.author.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(discussion.lastActivity)}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              <MessageCircle className="h-3 w-3 mr-1" /> {discussion.replies}
                            </Badge>
                          </div>
                          <CardTitle className="mt-2 text-lg hover:text-primary cursor-pointer">
                            {discussion.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex flex-wrap gap-2">
                            {discussion.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                              <ThumbsUp className="h-4 w-4 mr-1" /> {discussion.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                              <Share2 className="h-4 w-4 mr-1" /> Share
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary">
                            Read More <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  {filteredDiscussions.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No matching discussions found</h3>
                      <p className="text-muted-foreground mb-6">Try adjusting your search or start a new topic</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Start Discussion
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="md:w-1/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Start a Discussion</CardTitle>
                      <CardDescription>
                        Share your thoughts, ask questions, or seek advice from the community
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Input placeholder="Discussion title" />
                      </div>
                      <div>
                        <Textarea placeholder="What's on your mind?" className="min-h-32" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Post Discussion</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Popular Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge className="mr-2">productivity</Badge>
                        <Badge className="mr-2">habits</Badge>
                        <Badge className="mr-2">learning</Badge>
                        <Badge className="mr-2">mindfulness</Badge>
                        <Badge className="mr-2">career-growth</Badge>
                        <Badge className="mr-2">work-life</Badge>
                        <Badge className="mr-2">accountability</Badge>
                        <Badge className="mr-2">motivation</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Groups Tab */}
            <TabsContent value="groups">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Group Activities</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Create Group
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredActivities.map(activity => (
                      <Card key={activity.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle>{activity.title}</CardTitle>
                            <Badge variant={activity.type === "recurring" ? "outline" : "default"}>
                              {activity.type === "recurring" ? "Weekly" : "One-time"}
                            </Badge>
                          </div>
                          <CardDescription>{activity.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{formatDate(activity.date)}</span>
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{activity.time}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-2" />
                              <span>{activity.members} members joined</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">Join Activity</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  {filteredActivities.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No matching activities found</h3>
                      <p className="text-muted-foreground mb-6">Try adjusting your search or create a new group activity</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Create Activity
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="md:w-1/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Groups</CardTitle>
                      <CardDescription>
                        Groups you've joined or created
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Tech Growth Mastermind</h4>
                            <p className="text-sm text-muted-foreground">34 members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center">
                            <Book className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Non-Fiction Book Club</h4>
                            <p className="text-sm text-muted-foreground">28 members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-accent/10 w-10 h-10 rounded-full flex items-center justify-center">
                            <Brain className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium">Mindfulness Practice</h4>
                            <p className="text-sm text-muted-foreground">19 members</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View All Groups
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Suggested Activities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Morning Routine Challenge</h4>
                          <p className="text-sm text-muted-foreground">Starts in 3 days</p>
                        </div>
                        <Button size="sm" variant="outline">Join</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Creative Writing Workshop</h4>
                          <p className="text-sm text-muted-foreground">Weekly on Thursdays</p>
                        </div>
                        <Button size="sm" variant="outline">Join</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                        Community Growth Leaders
                      </CardTitle>
                      <CardDescription>
                        Members who have shown exceptional growth and contributions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Top 3 users */}
                        <div className="flex flex-col md:flex-row justify-around items-center gap-6 md:gap-2 mb-8">
                          {/* 2nd Place */}
                          <div className="flex flex-col items-center order-2 md:order-1">
                            <div className="relative">
                              <Avatar className="h-20 w-20 border-4 border-silver mb-2">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-xl">{getInitials(leaderboardData.leaderboard[1].name)}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-silver text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">2</div>
                            </div>
                            <h3 className="font-medium text-center mt-2">{leaderboardData.leaderboard[1].name}</h3>
                            <p className="text-primary font-bold">+{leaderboardData.leaderboard[1].growth}%</p>
                          </div>
                          
                          {/* 1st Place */}
                          <div className="flex flex-col items-center order-1 md:order-2">
                            <div className="relative">
                              <Avatar className="h-24 w-24 border-4 border-amber-500 mb-2">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-2xl">{getInitials(leaderboardData.leaderboard[0].name)}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">1</div>
                            </div>
                            <h3 className="font-semibold text-center mt-2">{leaderboardData.leaderboard[0].name}</h3>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                              <p className="text-primary font-bold">+{leaderboardData.leaderboard[0].growth}%</p>
                            </div>
                          </div>
                          
                          {/* 3rd Place */}
                          <div className="flex flex-col items-center order-3">
                            <div className="relative">
                              <Avatar className="h-20 w-20 border-4 border-amber-700 mb-2">
                                <AvatarImage src={null} />
                                <AvatarFallback className="text-xl">{getInitials(leaderboardData.leaderboard[2].name)}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">3</div>
                            </div>
                            <h3 className="font-medium text-center mt-2">{leaderboardData.leaderboard[2].name}</h3>
                            <p className="text-primary font-bold">+{leaderboardData.leaderboard[2].growth}%</p>
                          </div>
                        </div>
                      
                        {/* Other users */}
                        <div className="space-y-3">
                          {leaderboardData.leaderboard.slice(3).map((user, index) => (
                            <div key={user.id} className="flex items-center py-2 hover:bg-muted/50 px-2 rounded-md">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-foreground text-sm font-bold mr-3">
                                {index + 4}
                              </div>
                              <Avatar className="mr-3 h-10 w-10">
                                <AvatarImage src={user.avatar || ""} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium">{user.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {user.category === "leadership" && "Leadership Expert"}
                                  {user.category === "data_science" && "Data Scientist"}
                                  {user.category === "creative" && "Creative Director"}
                                  {user.category === "product" && "Product Manager"}
                                  {user.category === "design" && "UX Designer"}
                                  {user.category === "software" && "Software Engineer"}
                                </p>
                              </div>
                              <span className="font-bold text-primary">+{user.growth}%</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* User's position */}
                        {leaderboardData.userPosition && (
                          <div className="flex items-center p-3 mt-4 bg-muted border border-dashed border-primary rounded-lg">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold mr-3">
                              {leaderboardData.userPosition.position}
                            </div>
                            <Avatar className="mr-3">
                              <AvatarFallback>YO</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">You</h4>
                              <p className="text-sm text-muted-foreground">
                                {leaderboardData.userPosition.category === "product" && "Product Manager"}
                              </p>
                            </div>
                            <span className="font-bold text-primary">+{leaderboardData.userPosition.growth}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:w-1/3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Growth Insights</CardTitle>
                      <CardDescription>
                        How to improve your growth score
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Your Growth Score</h4>
                        <div className="flex items-center">
                          <Progress value={65} className="h-2 flex-1 mr-3" />
                          <span className="text-lg font-bold">65%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <span>Complete daily challenges</span>
                          </div>
                          <Badge>+5%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <span>Join group activities</span>
                          </div>
                          <Badge>+8%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                              <Circle className="h-4 w-4 text-slate-400" />
                            </div>
                            <span>Complete an assessment</span>
                          </div>
                          <Badge>+10%</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                              <Circle className="h-4 w-4 text-slate-400" />
                            </div>
                            <span>Help others in discussions</span>
                          </div>
                          <Badge>+7%</Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">View Growth Path</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Top Achievers This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>RJ</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">Robert Johnson</h4>
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">30 days streak</Badge>
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback>SL</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">Sarah Lee</h4>
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">5 challenges</Badge>
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}

// Import missing components
interface IconProps extends React.SVGProps<SVGSVGElement> {}

function Check(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Circle(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function Book(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function Brain(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04Z" />
    </svg>
  );
}