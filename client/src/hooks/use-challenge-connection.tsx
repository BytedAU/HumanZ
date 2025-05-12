import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Define message types
type Challenge = {
  id: number;
  title: string;
  description: string;
  challengeType: 'individual' | 'collaborative';
  category: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  currentParticipants: number | null;
  maxParticipants: number | null;
};

type ChallengeMessage = {
  id: number;
  challengeId: number;
  userId: number;
  content: string;
  createdAt: Date;
};

type ChallengeActivity = {
  id: number;
  challengeId: number;
  userId: number;
  activityType: string;
  data: any;
  createdAt: Date;
};

type UserProgress = {
  userId: number;
  progress: number;
  completed: boolean;
  timestamp: string;
};

type WebSocketMessage = {
  type: string;
  payload: any;
};

// WebSocket connection status
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useChallengeConnection(challengeId?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [messages, setMessages] = useState<ChallengeMessage[]>([]);
  const [activities, setActivities] = useState<ChallengeActivity[]>([]);
  const [participants, setParticipants] = useState<Set<number>>(new Set());
  const [progressMap, setProgressMap] = useState<Map<number, UserProgress>>(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    if (!challengeId || !user?.id) return;

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('connecting');

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Setup event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
      
      // Authenticate
      sendMessage({
        type: 'auth',
        payload: {
          userId: user.id,
          sessionId: 'session-placeholder' // In a real app, this would be a valid session ID
        }
      });
      
      // Join challenge
      sendMessage({
        type: 'join_challenge',
        payload: { challengeId }
      });
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setStatus('disconnected');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to challenge. Please try again.',
        variant: 'destructive',
      });
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        // Leave the challenge before closing
        if (socketRef.current.readyState === WebSocket.OPEN) {
          sendMessage({
            type: 'leave_challenge',
            payload: { challengeId }
          });
        }
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [challengeId, user?.id]);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Received message:', message.type, message.payload);
    
    switch (message.type) {
      case 'challenge_joined':
        setStatus('connected');
        setChallenge(message.payload.challenge);
        setMessages(message.payload.recentMessages);
        setActivities(message.payload.recentActivity);
        
        // Extract participants from messages and activities
        const participantIds = new Set<number>();
        
        message.payload.recentMessages.forEach((msg: ChallengeMessage) => {
          participantIds.add(msg.userId);
        });
        
        message.payload.recentActivity.forEach((activity: ChallengeActivity) => {
          participantIds.add(activity.userId);
          
          // Initialize progress map from activities
          if (activity.activityType === 'progress_update' || activity.activityType === 'complete') {
            setProgressMap(prev => {
              const newMap = new Map(prev);
              newMap.set(activity.userId, {
                userId: activity.userId,
                progress: activity.data.progress,
                completed: activity.activityType === 'complete',
                timestamp: activity.data.timestamp
              });
              return newMap;
            });
          }
        });
        
        setParticipants(participantIds);
        break;
        
      case 'user_joined':
        setParticipants(prev => {
          const newSet = new Set(prev);
          newSet.add(message.payload.userId);
          return newSet;
        });
        break;
        
      case 'user_left':
        setParticipants(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.payload.userId);
          return newSet;
        });
        break;
        
      case 'new_message':
        setMessages(prev => [...prev, message.payload]);
        break;
        
      case 'progress_update':
        setProgressMap(prev => {
          const newMap = new Map(prev);
          const { userId, progress, completed, timestamp } = message.payload;
          newMap.set(userId, { userId, progress, completed, timestamp });
          return newMap;
        });
        break;
        
      case 'error':
        toast({
          title: 'Error',
          description: message.payload.message,
          variant: 'destructive',
        });
        break;
    }
  }, [toast]);

  // Send a WebSocket message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }, []);

  // Send a chat message
  const sendChatMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    sendMessage({
      type: 'challenge_message',
      payload: { content }
    });
  }, [sendMessage]);

  // Update progress
  const updateProgress = useCallback((progress: number, completed = false) => {
    sendMessage({
      type: 'update_progress',
      payload: { progress, completed }
    });
  }, [sendMessage]);

  // Leave the challenge
  const leaveChallenge = useCallback(() => {
    if (challengeId) {
      sendMessage({
        type: 'leave_challenge',
        payload: { challengeId }
      });
    }
  }, [challengeId, sendMessage]);

  // Get user's progress
  const getUserProgress = useCallback((userId: number) => {
    return progressMap.get(userId);
  }, [progressMap]);

  // Get current user's progress
  const getMyProgress = useCallback(() => {
    if (!user?.id) return null;
    return progressMap.get(user.id);
  }, [progressMap, user?.id]);

  return {
    status,
    challenge,
    messages,
    activities,
    participants: Array.from(participants),
    sendChatMessage,
    updateProgress,
    leaveChallenge,
    getUserProgress,
    getMyProgress,
  };
}