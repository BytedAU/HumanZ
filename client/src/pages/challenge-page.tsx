import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import Header from "@/components/layout/header";
import SiteFooter from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Calendar, 
  Clock, 
  ChevronLeft,
  Share2, 
  MessageCircle, 
  Check, 
  FileText, 
  Video, 
  Send, 
  PlusCircle,
  Star, 
  Heart, 
  Award,
  BarChart,
  Link as LinkIcon,
  Flag,
  BookOpen,
  PanelRight,
  X,
  Edit,
  VideoIcon,
  Pin,
  Lightbulb,
  Smile,
  CheckCircle2,
  PenTool
} from "lucide-react";

// Mock challenge data
const CHALLENGES = [
  {
    id: 1,
    title: "San Francisco Social Explorer Challenge",
    description: "Explore the best networking spots in San Francisco and connect with new people weekly. This challenge is designed to help people build their social networks, discover new venues, and practice social skills in various environments.",
    category: "social",
    difficulty: "medium",
    participants: 68,
    durationDays: 30,
    startDate: new Date(2025, 4, 15),
    endDate: new Date(2025, 5, 15),
    isCollaborative: true,
    progress: 35,
    featuredImage: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&q=80&w=1500&h=500",
    createdBy: {
      id: 101,
      name: "Social Growth Team",
      avatar: null
    },
    tasks: [
      {
        id: 1,
        title: "Visit a networking event in SoMa",
        description: "Attend any networking event in San Francisco's SoMa district and connect with at least 3 new people.",
        dueDate: new Date(2025, 4, 22),
        isCompleted: true
      },
      {
        id: 2,
        title: "Try a coworking space in Mission District",
        description: "Work from a coworking space in Mission District for at least 3 hours and introduce yourself to someone new.",
        dueDate: new Date(2025, 4, 29),
        isCompleted: false
      },
      {
        id: 3,
        title: "Attend a tech meetup",
        description: "Join a technology-focused meetup in San Francisco and ask at least one question during the Q&A.",
        dueDate: new Date(2025, 5, 5),
        isCompleted: false
      },
      {
        id: 4,
        title: "Visit a social club",
        description: "Spend an evening at one of San Francisco's social clubs and engage in at least one group activity.",
        dueDate: new Date(2025, 5, 12),
        isCompleted: false
      }
    ],
    resources: [
      {
        id: 1,
        title: "Ultimate Guide to Networking in SF",
        type: "article",
        url: "#"
      },
      {
        id: 2,
        title: "Top 10 Coworking Spaces in San Francisco",
        type: "guide",
        url: "#"
      },
      {
        id: 3,
        title: "How to Make Meaningful Connections",
        type: "video",
        url: "#"
      }
    ],
    discussions: [
      {
        id: 1,
        author: {
          id: 201,
          name: "David Kim",
          avatar: null
        },
        content: "I found a great networking event happening next Tuesday at The Workshop Cafe in SoMa. Anyone interested in joining?",
        timestamp: new Date(2025, 4, 17, 14, 35),
        likes: 8,
        replies: [
          {
            id: 101,
            author: {
              id: 202,
              name: "Lisa Chen",
              avatar: null
            },
            content: "I'd be interested! What time does it start?",
            timestamp: new Date(2025, 4, 17, 15, 12),
            likes: 2
          },
          {
            id: 102,
            author: {
              id: 201,
              name: "David Kim",
              avatar: null
            },
            content: "It starts at 6:30 PM. Here's the link to register: [networking-event.com]",
            timestamp: new Date(2025, 4, 17, 16, 5),
            likes: 3
          }
        ]
      },
      {
        id: 2,
        author: {
          id: 203,
          name: "Sarah Johnson",
          avatar: null
        },
        content: "I tried the coworking space at WeWork in Mission District today. The community there is super friendly and they have great coffee! Highly recommend for task #2.",
        timestamp: new Date(2025, 4, 18, 10, 22),
        likes: 12,
        replies: []
      }
    ],
    participants: [
      {
        id: 301,
        name: "Alex Thompson",
        avatar: null,
        progress: 25
      },
      {
        id: 302,
        name: "Maya Patel",
        avatar: null,
        progress: 50
      },
      {
        id: 303,
        name: "Jordan Lee",
        avatar: null,
        progress: 75
      },
      {
        id: 304,
        name: "Taylor Wong",
        avatar: null,
        progress: 25
      },
      {
        id: 305,
        name: "Casey Rivera",
        avatar: null,
        progress: 50
      }
    ],
    leaderboard: [
      {
        id: 303,
        name: "Jordan Lee",
        avatar: null,
        points: 320
      },
      {
        id: 302,
        name: "Maya Patel",
        avatar: null,
        points: 295
      },
      {
        id: 301,
        name: "Alex Thompson",
        avatar: null,
        points: 240
      }
    ],
    activityFeed: [
      {
        id: 1,
        type: "joined",
        user: {
          id: 306,
          name: "Robin Garcia",
          avatar: null
        },
        timestamp: new Date(2025, 4, 18, 9, 15)
      },
      {
        id: 2,
        type: "completed_task",
        user: {
          id: 303,
          name: "Jordan Lee",
          avatar: null
        },
        task: "Visit a networking event in SoMa",
        timestamp: new Date(2025, 4, 17, 20, 45)
      },
      {
        id: 3,
        type: "shared_resource",
        user: {
          id: 302,
          name: "Maya Patel",
          avatar: null
        },
        resource: "7 Tips for Breaking the Ice at Networking Events",
        timestamp: new Date(2025, 4, 17, 14, 20)
      }
    ]
  },
  // Other challenges would be here
];

// Function to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
};

// Function to format time
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: true 
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

export default function ChallengePage() {
  const [, params] = useRoute("/challenges/:id");
  const challengeId = params?.id ? parseInt(params.id) : 1;
  const challenge = CHALLENGES.find(c => c.id === challengeId) || CHALLENGES[0];
  
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [challenge.discussions]);
  
  // Calculate completed tasks count
  const completedTasks = challenge.tasks.filter(task => task.isCompleted).length;
  const completionPercentage = (completedTasks / challenge.tasks.length) * 100;
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // In a real app, this would send the message to a server
    // and update the state when the server responds
    console.log("Sending message:", message);
    
    // Clear the input field
    setMessage("");
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Challenge Hero Section */}
        <div className="relative">
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={challenge.featuredImage}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
          
          <div className="container-custom relative -mt-32 pb-6">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <div className="flex items-center mb-3">
                    <Button variant="ghost" size="sm" className="mr-2 p-0">
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      <span>Back</span>
                    </Button>
                    
                    <Badge className={`
                      ${challenge.category === "social" ? "bg-blue-500" : ""}
                      ${challenge.category === "mindfulness" ? "bg-purple-500" : ""}
                      ${challenge.category === "leadership" ? "bg-amber-500" : ""}
                      ${challenge.category === "creativity" ? "bg-green-500" : ""}
                      text-white border-none ml-2
                    `}>
                      {challenge.category}
                    </Badge>
                    
                    {challenge.isCollaborative && (
                      <Badge variant="outline" className="ml-2">
                        <Users className="h-3 w-3 mr-1" /> Collaborative
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{challenge.title}</h1>
                  
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> 
                      <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> 
                      <span>{challenge.durationDays} days</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" /> 
                      <span>{challenge.participants} participants</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex mt-4 md:mt-0 space-x-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                  <Button size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Join Challenge
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Your Progress</h3>
                  <div className="flex items-center">
                    <Progress value={completionPercentage} className="h-2 flex-1 mr-3" />
                    <span className="text-sm font-medium">{completionPercentage.toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {completedTasks} of {challenge.tasks.length} tasks completed
                  </p>
                </div>
                
                <div className="md:w-1/3 lg:w-1/4">
                  <h3 className="font-semibold mb-2">Created by</h3>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{getInitials(challenge.createdBy.name)}</AvatarFallback>
                    </Avatar>
                    <span>{challenge.createdBy.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Challenge Content */}
        <div className="container-custom pb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column */}
            <div className={`${isChatOpen ? 'lg:w-2/3' : 'lg:w-full'} transition-all duration-300`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>About This Challenge</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {challenge.description}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Your Next Task</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {challenge.tasks.find(task => !task.isCompleted) ? (
                            <div>
                              <h3 className="font-medium mb-2">
                                {challenge.tasks.find(task => !task.isCompleted)?.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {challenge.tasks.find(task => !task.isCompleted)?.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <Badge variant="outline">
                                  <Calendar className="h-3 w-3 mr-1" /> 
                                  Due {formatDate(challenge.tasks.find(task => !task.isCompleted)?.dueDate || new Date())}
                                </Badge>
                                <Button size="sm">Mark Complete</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                              <h3 className="font-medium mb-1">All tasks completed!</h3>
                              <p className="text-sm text-muted-foreground">Great job completing all challenge tasks.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Latest Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {challenge.activityFeed.slice(0, 3).map(activity => (
                              <div key={activity.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-medium">{activity.user.name}</span>
                                    {activity.type === 'joined' && ' joined the challenge'}
                                    {activity.type === 'completed_task' && ` completed "${activity.task}"`}
                                    {activity.type === 'shared_resource' && ` shared "${activity.resource}"`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Challenge Leaderboard</CardTitle>
                        <CardDescription>Top performers in this challenge</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {challenge.leaderboard.map((user, index) => (
                            <div key={user.id} className="flex items-center py-2 px-3 hover:bg-muted/50 rounded-md">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold mr-3">
                                {index + 1}
                              </div>
                              <Avatar className="mr-3 h-10 w-10">
                                <AvatarImage src={user.avatar || ""} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium">{user.name}</h4>
                              </div>
                              <div className="flex items-center">
                                <Award className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="font-bold text-primary">{user.points} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Tasks Tab */}
                <TabsContent value="tasks">
                  <Card>
                    <CardHeader>
                      <CardTitle>Challenge Tasks</CardTitle>
                      <CardDescription>Complete these tasks to progress through the challenge</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {challenge.tasks.map((task, index) => (
                          <div 
                            key={task.id}
                            className={`border rounded-md p-4 ${task.isCompleted ? 'bg-green-50 border-green-200' : ''}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                                {task.isCompleted ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <span className="font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-medium text-lg ${task.isCompleted ? 'line-through text-green-700' : ''}`}>
                                  {task.title}
                                </h3>
                                <p className="text-muted-foreground mt-1 mb-3">
                                  {task.description}
                                </p>
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3 mr-1" /> 
                                    Due {formatDate(task.dueDate)}
                                  </Badge>
                                  
                                  {task.isCompleted ? (
                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                      Completed
                                    </Badge>
                                  ) : (
                                    <Button size="sm">Mark Complete</Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Community Tab */}
                <TabsContent value="community">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Challenge Participants</CardTitle>
                        <CardDescription>People taking part in this challenge</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {challenge.participants.map(participant => (
                            <div key={participant.id} className="flex items-center p-3 border rounded-md">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium">{participant.name}</h4>
                                <div className="flex items-center">
                                  <Progress value={participant.progress} className="h-1.5 w-20 mr-2" />
                                  <span className="text-xs text-muted-foreground">{participant.progress}%</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Discussions</CardTitle>
                        <CardDescription>Join the conversation with other participants</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {challenge.discussions.map(discussion => (
                            <div key={discussion.id} className="border rounded-md p-4">
                              <div className="flex items-start gap-3 mb-4">
                                <Avatar>
                                  <AvatarFallback>{getInitials(discussion.author.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">{discussion.author.name}</h4>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(discussion.timestamp)} at {formatTime(discussion.timestamp)}
                                    </span>
                                  </div>
                                  <p className="my-2">{discussion.content}</p>
                                  <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm" className="h-8 flex items-center gap-1 text-muted-foreground hover:text-primary">
                                      <Heart className="h-4 w-4" /> {discussion.likes}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 flex items-center gap-1 text-muted-foreground hover:text-primary">
                                      <MessageCircle className="h-4 w-4" /> Reply
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 flex items-center gap-1 text-muted-foreground hover:text-primary">
                                      <Share2 className="h-4 w-4" /> Share
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Replies */}
                              {discussion.replies.length > 0 && (
                                <div className="ml-12 space-y-4">
                                  {discussion.replies.map(reply => (
                                    <div key={reply.id} className="flex items-start gap-3 pt-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getInitials(reply.author.name)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <h4 className="font-medium text-sm">{reply.author.name}</h4>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(reply.timestamp)} at {formatTime(reply.timestamp)}
                                          </span>
                                        </div>
                                        <p className="my-1 text-sm">{reply.content}</p>
                                        <div className="flex items-center gap-4">
                                          <Button variant="ghost" size="sm" className="h-7 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                            <Heart className="h-3 w-3" /> {reply.likes}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <Textarea 
                            placeholder="Start a discussion..." 
                            className="mb-2"
                          />
                          <div className="flex justify-end">
                            <Button>Post Discussion</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Resources Tab */}
                <TabsContent value="resources">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Challenge Resources</CardTitle>
                        <CardDescription>Helpful materials for this challenge</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {challenge.resources.map(resource => (
                            <div key={resource.id} className="flex items-center p-4 border rounded-md">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                resource.type === 'article' ? 'bg-blue-100 text-blue-600' :
                                resource.type === 'guide' ? 'bg-purple-100 text-purple-600' :
                                resource.type === 'video' ? 'bg-red-100 text-red-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {resource.type === 'article' && <FileText className="h-5 w-5" />}
                                {resource.type === 'guide' && <BookOpen className="h-5 w-5" />}
                                {resource.type === 'video' && <VideoIcon className="h-5 w-5" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{resource.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                                </p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="font-medium mb-4">Recommended Tools</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-md text-center">
                              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <BarChart className="h-6 w-6 text-slate-600" />
                              </div>
                              <h4 className="font-medium mb-1">Progress Tracker</h4>
                              <p className="text-xs text-muted-foreground">Track your daily social activities</p>
                            </div>
                            <div className="p-4 border rounded-md text-center">
                              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <PenTool className="h-6 w-6 text-slate-600" />
                              </div>
                              <h4 className="font-medium mb-1">Reflection Journal</h4>
                              <p className="text-xs text-muted-foreground">Document your networking insights</p>
                            </div>
                            <div className="p-4 border rounded-md text-center">
                              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Pin className="h-6 w-6 text-slate-600" />
                              </div>
                              <h4 className="font-medium mb-1">Event Finder</h4>
                              <p className="text-xs text-muted-foreground">Discover networking events nearby</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right Column - Chat */}
            {isChatOpen && (
              <div className="lg:w-1/3 bg-white rounded-lg shadow-lg border overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Challenge Group Chat</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 max-h-[600px]">
                  <div className="space-y-4">
                    <div className="text-center text-xs text-muted-foreground my-4">
                      May 18, 2025
                    </div>
                    
                    {/* System message */}
                    <div className="flex justify-center">
                      <div className="bg-muted px-3 py-2 rounded-md text-xs text-muted-foreground max-w-xs">
                        Welcome to the San Francisco Social Explorer Challenge group chat!
                      </div>
                    </div>
                    
                    {/* Chat messages */}
                    <div className="flex">
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarFallback>MT</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Maya Patel</span>
                          <span className="text-xs text-muted-foreground ml-2">10:15 AM</span>
                        </div>
                        <div className="bg-muted px-3 py-2 rounded-md text-sm mt-1 max-w-xs">
                          Hey everyone! I'm excited to start this challenge. Anyone else from the Mission District?
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="max-w-xs">
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm">
                          I'm in North Beach, but I'm looking forward to exploring more of Mission!
                        </div>
                        <div className="text-xs text-right text-muted-foreground mt-1">
                          10:18 AM
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarFallback>JL</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Jordan Lee</span>
                          <span className="text-xs text-muted-foreground ml-2">10:22 AM</span>
                        </div>
                        <div className="bg-muted px-3 py-2 rounded-md text-sm mt-1 max-w-xs">
                          I found a great networking event at Dolores Park this weekend. Anyone want to join?
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarFallback>AT</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Alex Thompson</span>
                          <span className="text-xs text-muted-foreground ml-2">10:30 AM</span>
                        </div>
                        <div className="bg-muted px-3 py-2 rounded-md text-sm mt-1 max-w-xs">
                          Count me in! Can you share the details?
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarFallback>JL</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-sm">Jordan Lee</span>
                          <span className="text-xs text-muted-foreground ml-2">10:35 AM</span>
                        </div>
                        <div className="bg-muted px-3 py-2 rounded-md text-sm mt-1 max-w-xs">
                          Sure! It's the "SF Tech Social" on Saturday at 3 PM. I'll post the link to register in the discussion board.
                        </div>
                      </div>
                    </div>
                    
                    {/* More messages would be here */}
                    
                    <div ref={chatEndRef} />
                  </div>
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex items-center">
                    <Input 
                      placeholder="Type a message..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!message.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chat toggle button (visible when chat is closed on larger screens) */}
            {!isChatOpen && (
              <Button 
                className="fixed bottom-6 right-6 z-10 shadow-lg lg:flex hidden"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                <span>Open Chat</span>
              </Button>
            )}
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}