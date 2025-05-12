import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useChallengeConnection } from '@/hooks/use-challenge-connection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Users, Clock, ArrowLeft, Award } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function CollaborativeChallengeView() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const challengeId = params.id ? parseInt(params.id) : undefined;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [progress, setProgress] = useState(0);

  // Get initial challenge data
  const { data: initialChallenge, isLoading: isLoadingChallenge } = useQuery({
    queryKey: ['/api/challenges', challengeId],
    queryFn: () => fetch(`/api/challenges/${challengeId}`).then(res => res.json()),
    enabled: !!challengeId,
  });

  // Use the WebSocket connection hook
  const {
    status,
    challenge,
    messages,
    activities,
    participants,
    sendChatMessage,
    updateProgress,
    getMyProgress,
    getUserProgress,
  } = useChallengeConnection(challengeId);

  // Set initial progress from storage
  useEffect(() => {
    const myProgress = getMyProgress();
    if (myProgress) {
      setProgress(myProgress.progress);
    }
  }, [getMyProgress]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendChatMessage(messageText);
      setMessageText('');
    }
  };

  // Handle progress update
  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
    updateProgress(newProgress, newProgress === 100);
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingChallenge || !challengeId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!initialChallenge && !challenge) {
    return (
      <div className="text-center my-8">
        <h2 className="text-2xl font-bold mb-4">Challenge not found</h2>
        <Button onClick={() => setLocation('/challenges')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
        </Button>
      </div>
    );
  }

  const displayChallenge = challenge || initialChallenge;
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';
  const isDisconnected = status === 'disconnected' || status === 'error';
  const currentProgress = getMyProgress()?.progress || progress;
  const isCompleted = getMyProgress()?.completed || currentProgress === 100;

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Challenge Details and Participants */}
        <div className="md:col-span-1 space-y-6">
          <Button variant="outline" size="sm" onClick={() => setLocation('/challenges')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>{displayChallenge.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-500 bg-blue-50">
                  {displayChallenge.category}
                </Badge>
                <Badge variant="outline" className="text-green-500 bg-green-50">
                  Collaborative
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{displayChallenge.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(displayChallenge.startDate), 'MMM d')} - {format(new Date(displayChallenge.endDate), 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{displayChallenge.currentParticipants || participants.length} participants</span>
                {displayChallenge.maxParticipants && (
                  <span className="text-muted-foreground">/ {displayChallenge.maxParticipants} max</span>
                )}
              </div>
              
              <div className="pt-4">
                <h4 className="mb-2 font-medium">Your Progress</h4>
                <Progress value={currentProgress} className="h-2 mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{currentProgress}% Complete</span>
                  {isCompleted && (
                    <span className="flex items-center text-green-600">
                      <Award className="h-4 w-4 mr-1" /> Completed
                    </span>
                  )}
                </div>
                
                {!isCompleted && (
                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleProgressUpdate(Math.min(100, currentProgress + 10))}
                      disabled={isDisconnected || currentProgress >= 100}
                    >
                      Update Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleProgressUpdate(100)}
                      disabled={isDisconnected || currentProgress >= 100}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading participants...</p>
                ) : (
                  participants.map((participantId) => {
                    const participantProgress = getUserProgress(participantId);
                    return (
                      <div key={participantId} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{participantId === user?.id ? 'ME' : `U${participantId}`}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">{participantId === user?.id ? 'You' : `User ${participantId}`}</div>
                            {participantProgress?.completed && (
                              <Badge variant="outline" className="text-green-600">
                                <Award className="h-3 w-3 mr-1" /> Completed
                              </Badge>
                            )}
                          </div>
                          {participantProgress && (
                            <Progress value={participantProgress.progress} className="h-1.5 mt-1" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Chat and Activity Feed */}
        <div className="md:col-span-2 space-y-6">
          {/* Connection status */}
          {isDisconnected && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <p className="font-medium">Disconnected from challenge</p>
              <p>You are currently viewing static data. Realtime updates are unavailable.</p>
            </div>
          )}
          
          {isConnecting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <p>Connecting to challenge...</p>
            </div>
          )}
          
          {/* Chat Interface */}
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Challenge Chat</CardTitle>
            </CardHeader>
            
            <ScrollArea className="flex-1 px-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet. Be the first to send a message!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex gap-3 ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.userId !== user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{`U${message.userId}`}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.userId === user?.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex justify-between gap-4 text-xs mb-1">
                          <span className={message.userId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                            {message.userId === user?.id ? 'You' : `User ${message.userId}`}
                          </span>
                          <span className={message.userId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      
                      {message.userId === user?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            <Separator />
            
            <CardFooter className="p-3">
              <div className="flex w-full gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isDisconnected}
                  className="flex-1 min-h-[60px] max-h-[120px]"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!messageText.trim() || isDisconnected}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {activities.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No activity yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice().reverse().map((activity) => {
                      let content = '';
                      switch (activity.activityType) {
                        case 'join':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} joined the challenge`;
                          break;
                        case 'leave':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} left the challenge`;
                          break;
                        case 'create':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} created the challenge`;
                          break;
                        case 'progress_update':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} updated progress to ${activity.data.progress}%`;
                          break;
                        case 'complete':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} completed the challenge! 🎉`;
                          break;
                        case 'message':
                          content = `User ${activity.userId === user?.id ? 'You' : activity.userId} sent a message`;
                          break;
                      }
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-3 text-sm">
                          <div className="w-10 text-center">
                            <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full">
                              {activity.userId === user?.id ? 'ME' : activity.userId}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <p>{content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}