import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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

type ChallengeMessage = {
  id: number;
  challengeId: number;
  userId: number;
  content: string;
  createdAt: string;
};

type ChallengeActivity = {
  id: number;
  challengeId: number;
  userId: number;
  activityType: 'join' | 'leave' | 'message' | 'progress_update' | 'complete' | 'milestone';
  data: any;
  createdAt: string;
};

type UserProgress = {
  userId: number;
  progress: number;
  completed: boolean;
};

export function useChallengeConnection(challengeId?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [messages, setMessages] = useState<ChallengeMessage[]>([]);
  const [activities, setActivities] = useState<ChallengeActivity[]>([]);
  const [participants, setParticipants] = useState<number[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  
  const webSocket = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Set up WebSocket connection
  useEffect(() => {
    if (!challengeId || !user) return;
    
    const connectWebSocket = () => {
      // Clean up any existing connection
      if (webSocket.current) {
        webSocket.current.close();
        webSocket.current = null;
      }
      
      setStatus('connecting');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        const socket = new WebSocket(wsUrl);
        webSocket.current = socket;
        
        socket.onopen = () => {
          console.log('WebSocket connection established');
          setStatus('connected');
          reconnectAttempts.current = 0;
          
          // Authenticate with the server using the user's ID and join the challenge
          sendMessage({
            type: 'auth',
            payload: { 
              userId: user.id,
              sessionId: 'session-placeholder' // In production, this would be a real session ID
            }
          });
          
          // Join the challenge
          sendMessage({
            type: 'join_challenge',
            payload: { challengeId }
          });
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          switch (data.type) {
            case 'auth_success':
              console.log('Authentication successful');
              break;
              
            case 'auth_error':
              setStatus('error');
              toast({
                title: 'Authentication Error',
                description: data.payload.message,
                variant: 'destructive'
              });
              break;
              
            case 'join_success':
              setChallenge(data.payload.challenge);
              setMessages(data.payload.messages);
              setActivities(data.payload.activities);
              setParticipants(data.payload.participants);
              
              // Initialize user progress map
              const initialProgressMap = new Map<number, UserProgress>();
              data.payload.userProgress.forEach((progress: UserProgress) => {
                initialProgressMap.set(progress.userId, progress);
              });
              setUserProgress(initialProgressMap);
              
              toast({
                title: 'Joined Challenge',
                description: `You've joined the challenge: ${data.payload.challenge.title}`,
              });
              break;
              
            case 'join_error':
              setStatus('error');
              toast({
                title: 'Error Joining Challenge',
                description: data.payload.message,
                variant: 'destructive'
              });
              break;
              
            case 'user_joined':
              setParticipants(prev => [...prev, data.payload.userId]);
              if (data.payload.activity) {
                setActivities(prev => [...prev, data.payload.activity]);
              }
              break;
              
            case 'user_left':
              setParticipants(prev => prev.filter(id => id !== data.payload.userId));
              if (data.payload.activity) {
                setActivities(prev => [...prev, data.payload.activity]);
              }
              break;
              
            case 'new_message':
              setMessages(prev => [...prev, data.payload.message]);
              if (data.payload.activity) {
                setActivities(prev => [...prev, data.payload.activity]);
              }
              break;
              
            case 'progress_update':
              setUserProgress(prev => {
                const newMap = new Map(prev);
                newMap.set(data.payload.userId, {
                  userId: data.payload.userId,
                  progress: data.payload.progress,
                  completed: data.payload.completed
                });
                return newMap;
              });
              
              if (data.payload.activity) {
                setActivities(prev => [...prev, data.payload.activity]);
              }
              
              // If the current user completed the challenge, show a toast
              if (data.payload.userId === user.id && data.payload.completed) {
                toast({
                  title: 'Challenge Completed! 🎉',
                  description: 'Congratulations on completing this challenge!',
                  variant: 'default',
                });
              }
              break;
              
            case 'error':
              toast({
                title: 'Error',
                description: data.payload.message,
                variant: 'destructive'
              });
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        };
        
        socket.onclose = (event) => {
          if (event.wasClean) {
            console.log(`WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            setStatus('disconnected');
          } else {
            console.error('WebSocket connection died');
            setStatus('error');
            
            // Attempt to reconnect if not at max attempts
            if (reconnectAttempts.current < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
              console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
              
              if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
              }
              
              reconnectTimeout.current = setTimeout(() => {
                reconnectAttempts.current += 1;
                connectWebSocket();
              }, delay);
            } else {
              toast({
                title: 'Connection Failed',
                description: 'Could not connect to the challenge. Please try refreshing the page.',
                variant: 'destructive'
              });
            }
          }
        };
        
        socket.onerror = () => {
          console.error('WebSocket error');
          setStatus('error');
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setStatus('error');
        
        toast({
          title: 'Connection Error',
          description: 'Could not connect to the challenge server.',
          variant: 'destructive'
        });
      }
    };
    
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (webSocket.current) {
        if (webSocket.current.readyState === WebSocket.OPEN) {
          // Send leave message before closing
          sendMessage({
            type: 'leave_challenge',
            payload: {}
          });
        }
        
        webSocket.current.close();
        webSocket.current = null;
      }
      
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };
  }, [challengeId, user, toast]);
  
  // Helper function to send messages through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open, cannot send message:', message);
    }
  }, []);
  
  // Function to send a chat message
  const sendChatMessage = useCallback((content: string) => {
    if (!challengeId) return;
    
    sendMessage({
      type: 'challenge_message',
      payload: { content }
    });
  }, [challengeId, sendMessage]);
  
  // Function to update progress
  const updateProgress = useCallback((progress: number, completed: boolean = false) => {
    if (!challengeId) return;
    
    sendMessage({
      type: 'progress_update',
      payload: { progress, completed }
    });
  }, [challengeId, sendMessage]);
  
  // Function to get current user's progress
  const getMyProgress = useCallback(() => {
    if (!user) return null;
    return userProgress.get(user.id) || null;
  }, [user, userProgress]);
  
  // Function to get a specific user's progress
  const getUserProgress = useCallback((userId: number) => {
    return userProgress.get(userId) || null;
  }, [userProgress]);
  
  return {
    status,
    challenge,
    messages,
    activities,
    participants,
    sendChatMessage,
    updateProgress,
    getMyProgress,
    getUserProgress
  };
}