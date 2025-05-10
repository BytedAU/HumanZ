import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import SiteFooter from "@/components/layout/site-footer";
import ChallengeList from "@/components/community/challenge-list";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Trophy, Flag, Users, Star, ChevronRight } from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("challenges");
  
  const { data: leaderboardData } = useQuery({
    queryKey: ["/api/leaderboard"],
  });
  
  // Sample community events (in a real app, these would come from the API)
  const communityEvents = [
    {
      id: 1,
      title: "Monthly Leadership Workshop",
      description: "Join our leadership expert for a hands-on workshop to develop your leadership skills.",
      date: "2025-03-15T18:00:00Z",
      participants: 28,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600&q=80"
    },
    {
      id: 2,
      title: "Goal Setting Masterclass",
      description: "Learn how to set effective, achievable goals that align with your personal and professional aspirations.",
      date: "2025-03-22T15:00:00Z",
      participants: 42,
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600&q=80"
    }
  ];
  
  // Format date
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0" />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-background">
          {/* Hero section */}
          <div className="hero-gradient text-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="container-custom">
              <div className="md:flex md:items-center md:justify-between">
                <div className="md:w-1/2 animate-fade-in">
                  <h1 className="text-4xl font-bold mb-6">Grow Together with the Community</h1>
                  <p className="text-xl mb-8">Join challenges, compete on leaderboards, and attend events to accelerate your personal growth journey.</p>
                  <div className="flex space-x-4">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      <Flag className="h-4 w-4 mr-2" />
                      Join a Challenge
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      <Users className="h-4 w-4 mr-2" />
                      Explore Events
                    </Button>
                  </div>
                </div>
                <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center animate-slide-up">
                  <img
                    src="https://images.unsplash.com/photo-1517486808906-6ca8b3f8e7a4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400"
                    alt="Community growth challenges"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="container-custom py-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="challenges" className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Challenges
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center">
                  <Flag className="h-4 w-4 mr-2" />
                  Events
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="challenges">
                <ChallengeList />
              </TabsContent>
              
              <TabsContent value="leaderboard">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Growth Leaderboard</h2>
                    <Card className="shadow-soft">
                      <CardHeader className="pb-0">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-medium">Top Performers This Week</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {leaderboardData?.leaderboard ? (
                          <div className="space-y-6">
                            {/* Top 3 with medals */}
                            <div className="flex flex-wrap justify-around gap-4 mb-8">
                              {/* 2nd place */}
                              <div className="flex flex-col items-center order-1 md:order-1">
                                <div className="relative">
                                  <Avatar className="h-20 w-20 border-4 border-accent">
                                    <AvatarImage 
                                      src={null} 
                                      alt={leaderboardData.leaderboard[1]?.name} 
                                    />
                                    <AvatarFallback className="text-xl">
                                      {getInitials(leaderboardData.leaderboard[1]?.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                                    2
                                  </div>
                                </div>
                                <div className="mt-5 text-center">
                                  <p className="font-medium">{leaderboardData.leaderboard[1]?.name}</p>
                                  <p className="text-sm text-muted-foreground">+{leaderboardData.leaderboard[1]?.growth}%</p>
                                </div>
                              </div>
                              
                              {/* 1st place */}
                              <div className="flex flex-col items-center order-0 md:order-0">
                                <div className="relative">
                                  <Avatar className="h-24 w-24 border-4 border-primary">
                                    <AvatarImage 
                                      src={null} 
                                      alt={leaderboardData.leaderboard[0]?.name} 
                                    />
                                    <AvatarFallback className="text-2xl">
                                      {getInitials(leaderboardData.leaderboard[0]?.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                                    1
                                  </div>
                                </div>
                                <div className="mt-5 text-center">
                                  <p className="font-medium">{leaderboardData.leaderboard[0]?.name}</p>
                                  <p className="text-sm text-muted-foreground">+{leaderboardData.leaderboard[0]?.growth}%</p>
                                </div>
                              </div>
                              
                              {/* 3rd place */}
                              <div className="flex flex-col items-center order-2 md:order-2">
                                <div className="relative">
                                  <Avatar className="h-20 w-20 border-4 border-secondary">
                                    <AvatarImage 
                                      src={null} 
                                      alt={leaderboardData.leaderboard[2]?.name} 
                                    />
                                    <AvatarFallback className="text-xl">
                                      {getInitials(leaderboardData.leaderboard[2]?.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-secondary text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                                    3
                                  </div>
                                </div>
                                <div className="mt-5 text-center">
                                  <p className="font-medium">{leaderboardData.leaderboard[2]?.name}</p>
                                  <p className="text-sm text-muted-foreground">+{leaderboardData.leaderboard[2]?.growth}%</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Rest of leaderboard */}
                            <div className="space-y-3">
                              {leaderboardData.leaderboard.slice(3).map((user, index) => (
                                <div key={user.id} className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-foreground text-sm font-bold mr-3">
                                    {index + 4}
                                  </div>
                                  <Avatar className="h-10 w-10 mr-3">
                                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h4 className="text-foreground font-medium">{user.name}</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{user.category.replace('_', ' ')}</p>
                                  </div>
                                  <span className="font-bold text-primary">+{user.growth}%</span>
                                </div>
                              ))}
                              
                              {/* Current user position */}
                              {leaderboardData.userPosition && (
                                <div className="flex items-center p-3 bg-muted border border-dashed border-primary rounded-lg mt-4">
                                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-white text-sm font-bold mr-3">
                                    {leaderboardData.userPosition.position}
                                  </div>
                                  <Avatar className="h-10 w-10 mr-3">
                                    <AvatarFallback>YOU</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h4 className="text-foreground font-medium">You</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{leaderboardData.userPosition.category.replace('_', ' ')}</p>
                                  </div>
                                  <span className="font-bold text-primary">+{leaderboardData.userPosition.growth}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center items-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-opacity-30 border-t-primary rounded-full"></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Achievements</h2>
                    <Card className="shadow-soft">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Your Badges</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                              <Star className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xs text-center">First Goal</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mb-2">
                              <Trophy className="h-6 w-6 text-secondary" />
                            </div>
                            <span className="text-xs text-center">5 Challenges</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                              <Award className="h-6 w-6 text-accent" />
                            </div>
                            <span className="text-xs text-center">Top 10</span>
                          </div>
                          <div className="flex flex-col items-center opacity-40">
                            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-2">
                              <Star className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span className="text-xs text-center">Locked</span>
                          </div>
                          <div className="flex flex-col items-center opacity-40">
                            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-2">
                              <Star className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span className="text-xs text-center">Locked</span>
                          </div>
                          <div className="flex flex-col items-center opacity-40">
                            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-2">
                              <Star className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span className="text-xs text-center">Locked</span>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <Button variant="outline" className="w-full">
                            View All Achievements
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="events">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Community Events</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {communityEvents.map(event => (
                    <Card key={event.id} className="shadow-soft hover:shadow-md transition-shadow overflow-hidden">
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <CardContent className="p-6">
                        <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                          Online Event
                        </Badge>
                        <h3 className="text-xl font-medium text-foreground mb-2">{event.title}</h3>
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatEventDate(event.date)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{event.participants} attending</span>
                          </div>
                          <Button>
                            Register
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Card className="shadow-soft bg-muted/20 border-dashed flex items-center justify-center p-6 h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flag className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Suggest an Event</h3>
                      <p className="text-muted-foreground mb-4">
                        Have an idea for a community event? Let us know and we might organize it!
                      </p>
                      <Button variant="outline">
                        Submit Event Idea
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <SiteFooter />
      </div>
    </div>
  );
}
