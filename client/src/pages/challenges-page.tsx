import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, Users, Clock, Calendar, Award, Search } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

type Challenge = {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  challengeType: 'individual' | 'collaborative';
  startDate: string;
  endDate: string;
  createdBy: number;
  maxParticipants: number | null;
  currentParticipants: number | null;
  createdAt: string;
};

type UserChallenge = {
  id: number;
  userId: number;
  challengeId: number;
  progress: number;
  isCompleted: boolean;
  joinedAt: string;
};

export default function ChallengesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch all challenges
  const { 
    data: challenges = [], 
    isLoading: isLoadingChallenges 
  } = useQuery({
    queryKey: ['/api/challenges'],
    queryFn: () => fetch('/api/challenges').then(res => res.json()),
  });
  
  // Fetch user's challenges
  const { 
    data: userChallenges = [],
    isLoading: isLoadingUserChallenges
  } = useQuery({
    queryKey: ['/api/user-challenges'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/challenges');
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Error fetching user challenges:', error);
        return [];
      }
    },
  });
  
  // Create a map of challenge ID to user challenge for quick lookup
  const userChallengeMap = userChallenges.reduce((acc, uc) => {
    acc[uc.challengeId] = uc;
    return acc;
  }, {});
  
  // Filter challenges based on search query and tab
  const filteredChallenges = challenges.filter(challenge => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    const isJoined = userChallengeMap[challenge.id] !== undefined;
    const isActive = !isPast(new Date(challenge.endDate));
    const isCompleted = userChallengeMap[challenge.id]?.isCompleted || false;
    
    switch(activeTab) {
      case 'all':
        return matchesSearch;
      case 'joined':
        return matchesSearch && isJoined;
      case 'active':
        return matchesSearch && isActive;
      case 'completed':
        return matchesSearch && isCompleted;
      default:
        return matchesSearch;
    }
  });
  
  const isLoading = isLoadingChallenges || isLoadingUserChallenges;
  
  // Sort challenges: active first, then by start date (newest first)
  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    const aActive = !isPast(new Date(a.endDate));
    const bActive = !isPast(new Date(b.endDate));
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Challenges</h1>
          <Button onClick={() => setLocation('/challenges/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </div>
        
        <div className="flex items-center px-3 py-2 rounded-md border">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            placeholder="Search challenges by title, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="joined">My Challenges</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sortedChallenges.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No challenges found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all' 
                    ? "There are no challenges available at the moment."
                    : activeTab === 'joined'
                    ? "You haven't joined any challenges yet."
                    : activeTab === 'active'
                    ? "There are no active challenges at the moment."
                    : "You haven't completed any challenges yet."}
                </p>
                {(activeTab === 'joined' || activeTab === 'completed') && (
                  <Button variant="outline" onClick={() => setActiveTab('all')}>
                    Browse All Challenges
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedChallenges.map(challenge => {
                  const userChallenge = userChallengeMap[challenge.id];
                  const hasJoined = !!userChallenge;
                  const isActive = !isPast(new Date(challenge.endDate));
                  const hasStarted = isPast(new Date(challenge.startDate));
                  const isUpcoming = isFuture(new Date(challenge.startDate));
                  
                  return (
                    <Card key={challenge.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                          <Badge variant={challenge.challengeType === 'collaborative' ? 'outline' : 'secondary'}>
                            {challenge.challengeType === 'collaborative' ? 'Collaborative' : 'Individual'}
                          </Badge>
                        </div>
                        <CardDescription className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-blue-500 bg-blue-50">
                            {challenge.category}
                          </Badge>
                          {isUpcoming && (
                            <Badge variant="outline" className="text-orange-500 bg-orange-50">
                              Upcoming
                            </Badge>
                          )}
                          {!isActive && hasStarted && (
                            <Badge variant="outline" className="text-gray-500 bg-gray-50">
                              Ended
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-3">
                        <p className="line-clamp-3 mb-4">{challenge.description}</p>
                        
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(challenge.startDate), 'MMM d')} - {format(new Date(challenge.endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{challenge.duration} day{challenge.duration !== 1 ? 's' : ''}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{challenge.currentParticipants || 0} participating</span>
                            {challenge.maxParticipants && (
                              <span>/ {challenge.maxParticipants} max</span>
                            )}
                          </div>
                        </div>
                        
                        {hasJoined && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Your Progress</span>
                              <span className="text-sm text-muted-foreground">{userChallenge.progress}%</span>
                            </div>
                            <Progress value={userChallenge.progress} className="h-2" />
                            
                            {userChallenge.isCompleted && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                                <Award className="h-4 w-4" />
                                <span>Completed!</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      
                      <Separator />
                      
                      <CardFooter className="pt-4">
                        {hasJoined ? (
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => setLocation(`/challenges/${challenge.id}`)}
                          >
                            View Challenge
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setLocation(`/challenges/${challenge.id}`)}
                          >
                            Join Challenge
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}