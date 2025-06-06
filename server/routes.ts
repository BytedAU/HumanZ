import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateAssessmentFeedback, generateGrowthInsights, generateGoalRecommendations } from "./openai";
import { implementLearningPathMethods } from "./storage-methods";
import { z } from "zod";
import { WebSocketServer, WebSocket } from 'ws';

// Define types for WebSocket messages
type WebSocketMessage = {
  type: string;
  payload: any;
};

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  challengeId?: number;
  isAlive: boolean;
}

// Keep track of connected clients by challenge
const challengeClients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize learning path methods
  implementLearningPathMethods(storage);
  
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAlive = true;
    
    // Handle ping/pong to detect disconnected clients
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle messages
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        
        switch (parsedMessage.type) {
          case 'auth':
            // Authenticate the WebSocket connection
            handleAuth(ws, parsedMessage.payload);
            break;
            
          case 'join_challenge':
            // Join a collaborative challenge
            await handleJoinChallenge(ws, parsedMessage.payload);
            break;
            
          case 'leave_challenge':
            // Leave a collaborative challenge
            await handleLeaveChallenge(ws, parsedMessage.payload);
            break;
            
          case 'challenge_message':
            // Send a message in the challenge
            await handleChallengeMessage(ws, parsedMessage.payload);
            break;
            
          case 'update_progress':
            // Update progress in the challenge
            await handleProgressUpdate(ws, parsedMessage.payload);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      if (ws.userId && ws.challengeId) {
        removeClientFromChallenge(ws);
      }
    });
  });
  
  // Ping clients every 30 seconds to detect disconnected clients
  setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        // Client hasn't responded to ping, terminate connection
        if (ws.userId && ws.challengeId) {
          removeClientFromChallenge(ws);
        }
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  // WebSocket message handler functions
  function handleAuth(ws: AuthenticatedWebSocket, payload: { userId: number, sessionId: string }) {
    // In a production app, verify the session ID against the database
    // For now, we'll just trust the client
    ws.userId = payload.userId;
  }
  
  async function handleJoinChallenge(ws: AuthenticatedWebSocket, payload: { challengeId: number }) {
    if (!ws.userId) {
      sendErrorToClient(ws, 'Not authenticated');
      return;
    }
    
    const { challengeId } = payload;
    const challenge = await storage.getChallenge(challengeId);
    
    if (!challenge) {
      sendErrorToClient(ws, 'Challenge not found');
      return;
    }
    
    if (challenge.challengeType !== 'collaborative') {
      sendErrorToClient(ws, 'Not a collaborative challenge');
      return;
    }
    
    // Add client to challenge room
    ws.challengeId = challengeId;
    
    // Initialize set of clients for this challenge if needed
    if (!challengeClients.has(challengeId)) {
      challengeClients.set(challengeId, new Set());
    }
    
    const clients = challengeClients.get(challengeId)!;
    clients.add(ws);
    
    // Create or update user participation in challenge
    let userChallenge = (await storage.getUserChallengesByChallengeId(challengeId))
      .find(uc => uc.userId === ws.userId);
    
    if (!userChallenge) {
      // User is joining for the first time
      userChallenge = await storage.createUserChallenge({
        userId: ws.userId,
        challengeId,
        progress: 0,
        isCompleted: false
      });
      
      // Update challenge participant count
      if (challenge.currentParticipants !== null) {
        await storage.updateChallenge(challengeId, { 
          currentParticipants: challenge.currentParticipants + 1 
        });
      }
      
      // Create activity
      await storage.createChallengeActivity({
        challengeId,
        userId: ws.userId,
        activityType: 'join',
        data: { timestamp: new Date().toISOString() }
      });
    }
    
    // Send welcome message and recent activity to client
    const recentMessages = await storage.getChallengeMessages(challengeId);
    const recentActivity = await storage.getChallengeActivities(challengeId, 10);
    
    sendToClient(ws, {
      type: 'challenge_joined',
      payload: {
        challenge,
        recentMessages,
        recentActivity
      }
    });
    
    // Broadcast join notification to other clients
    broadcastToChallenge(challengeId, {
      type: 'user_joined',
      payload: {
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    }, ws);
  }
  
  async function handleLeaveChallenge(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.challengeId) {
      return;
    }
    
    await removeClientFromChallenge(ws);
  }
  
  async function handleChallengeMessage(ws: AuthenticatedWebSocket, payload: { content: string }) {
    if (!ws.userId || !ws.challengeId) {
      sendErrorToClient(ws, 'Not in a challenge');
      return;
    }
    
    const { content } = payload;
    if (!content || content.trim() === '') {
      sendErrorToClient(ws, 'Message content cannot be empty');
      return;
    }
    
    // Save message to database
    const message = await storage.createChallengeMessage({
      challengeId: ws.challengeId,
      userId: ws.userId,
      content
    });
    
    // Broadcast message to all clients in the challenge
    broadcastToChallenge(ws.challengeId, {
      type: 'new_message',
      payload: message
    });
  }
  
  async function handleProgressUpdate(ws: AuthenticatedWebSocket, payload: { progress: number, completed: boolean }) {
    if (!ws.userId || !ws.challengeId) {
      sendErrorToClient(ws, 'Not in a challenge');
      return;
    }
    
    const { progress, completed } = payload;
    
    // Find user's challenge participation
    const userChallenges = await storage.getUserChallengesByChallengeId(ws.challengeId);
    const userChallenge = userChallenges.find(uc => uc.userId === ws.userId);
    
    if (!userChallenge) {
      sendErrorToClient(ws, 'Not participating in challenge');
      return;
    }
    
    // Update progress
    await storage.updateUserChallenge(userChallenge.id, {
      progress,
      isCompleted: completed
    });
    
    // Create activity
    await storage.createChallengeActivity({
      challengeId: ws.challengeId,
      userId: ws.userId,
      activityType: completed ? 'complete' : 'progress_update',
      data: { progress, timestamp: new Date().toISOString() }
    });
    
    // Broadcast progress update to all clients in the challenge
    broadcastToChallenge(ws.challengeId, {
      type: 'progress_update',
      payload: {
        userId: ws.userId,
        progress,
        completed,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  async function removeClientFromChallenge(ws: AuthenticatedWebSocket) {
    if (!ws.userId || !ws.challengeId) {
      return;
    }
    
    const challengeId = ws.challengeId;
    
    // Remove client from challenge room
    const clients = challengeClients.get(challengeId);
    if (clients) {
      clients.delete(ws);
      
      // If no more clients in the challenge, remove the challenge room
      if (clients.size === 0) {
        challengeClients.delete(challengeId);
      }
    }
    
    // Create activity for leaving
    await storage.createChallengeActivity({
      challengeId,
      userId: ws.userId,
      activityType: 'leave',
      data: { timestamp: new Date().toISOString() }
    });
    
    // Broadcast leave notification to other clients
    broadcastToChallenge(challengeId, {
      type: 'user_left',
      payload: {
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clear challenge ID from client
    ws.challengeId = undefined;
  }
  
  function broadcastToChallenge(challengeId: number, message: any, excludeClient?: WebSocket) {
    const clients = challengeClients.get(challengeId);
    if (!clients) return;
    
    const messageStr = JSON.stringify(message);
    
    clients.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  function sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  function sendErrorToClient(ws: WebSocket, error: string) {
    sendToClient(ws, {
      type: 'error',
      payload: { message: error }
    });
  }
  
  // Setup API Routes
  setupApiRoutes(app);
  
  // Return the HTTP server
  return httpServer;
}

// Define the API routes for the application
function setupApiRoutes(app: Express) {
  // Goals API
  app.get("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const goals = await storage.getGoalsByUserId(req.user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  
  app.post("/api/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const goalSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().optional(),
        category: z.string(),
        deadline: z.string().optional(), // ISO date string
        priority: z.string().optional() // low, medium, high
      });
      
      const validatedData = goalSchema.parse(req.body);
      
      const goal = await storage.createGoal({
        userId: req.user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        priority: validatedData.priority || "medium",
        progress: 0,
        isCompleted: false
      });
      
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });
  
  app.patch("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const goalId = parseInt(req.params.id);
    if (isNaN(goalId)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }
    
    try {
      const existingGoal = await storage.getGoal(goalId);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (existingGoal.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this goal" });
      }
      
      const updateSchema = z.object({
        title: z.string().min(3).max(100).optional(),
        description: z.string().nullable().optional(),
        category: z.string().optional(),
        deadline: z.string().nullable().optional(), // ISO date string
        priority: z.string().optional(), // low, medium, high
        progress: z.number().min(0).max(100).optional(),
        isCompleted: z.boolean().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // If deadline is provided as string, convert to Date
      if (validatedData.deadline) {
        validatedData.deadline = new Date(validatedData.deadline);
      }
      
      const updatedGoal = await storage.updateGoal(goalId, validatedData);
      res.json(updatedGoal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update goal" });
    }
  });
  
  app.delete("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const goalId = parseInt(req.params.id);
    if (isNaN(goalId)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }
    
    try {
      const existingGoal = await storage.getGoal(goalId);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (existingGoal.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this goal" });
      }
      
      await storage.deleteGoal(goalId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });
  
  // Assessment routes
  app.get("/api/assessments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });
  
  app.get("/api/user-assessments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userAssessments = await storage.getUserAssessmentsByUserId(req.user.id);
      res.json(userAssessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessment history" });
    }
  });
  
  app.post("/api/assessments/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const assessmentId = parseInt(req.params.id);
    if (isNaN(assessmentId)) {
      return res.status(400).json({ message: "Invalid assessment ID" });
    }
    
    try {
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const answersSchema = z.object({
        responses: z.record(z.string(), z.number().min(1).max(10))
      });
      
      const validatedData = answersSchema.parse(req.body);
      
      // Calculate score (simple average for now)
      const values = Object.values(validatedData.responses) as number[];
      const score = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Create user assessment
      const userAssessment = await storage.createUserAssessment({
        userId: req.user.id,
        assessmentId,
        responses: validatedData.responses,
        score
      });
      
      // Generate AI feedback if OPENAI_API_KEY is available
      let feedback = null;
      if (process.env.OPENAI_API_KEY) {
        feedback = await generateAssessmentFeedback(assessment, userAssessment);
      }
      
      res.status(201).json({
        userAssessment,
        feedback
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to submit assessment" });
    }
  });
  
  // Growth Tracking routes
  app.get("/api/growth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const growth = await storage.getGrowthByUserId(req.user.id);
      res.json(growth);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch growth data" });
    }
  });
  
  app.get("/api/growth/weekly", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const weeklyGrowth = await storage.getWeeklyGrowthByUserId(req.user.id);
      
      // Generate insights if OPENAI_API_KEY is available
      let insights = null;
      if (process.env.OPENAI_API_KEY && weeklyGrowth.length > 0) {
        insights = await generateGrowthInsights(weeklyGrowth);
      }
      
      res.json({
        data: weeklyGrowth,
        insights
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly growth data" });
    }
  });
  
  app.post("/api/growth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const growthSchema = z.object({
        category: z.string(),
        value: z.number().min(0).max(100),
        date: z.string() // ISO date string
      });
      
      const validatedData = growthSchema.parse(req.body);
      
      const growth = await storage.createGrowth({
        userId: req.user.id,
        category: validatedData.category,
        value: validatedData.value,
        date: new Date(validatedData.date)
      });
      
      res.status(201).json(growth);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to record growth data" });
    }
  });
  
  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });
  
  app.get("/api/challenges/collaborative", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challenges = await storage.getCollaborativeChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaborative challenges" });
    }
  });
  
  app.get("/api/challenges/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });
  
  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string(),
        category: z.string(),
        duration: z.number().min(1),
        challengeType: z.enum(['individual', 'collaborative']),
        startDate: z.string(), // ISO date string
        endDate: z.string(), // ISO date string
        maxParticipants: z.number().nullable()
      });
      
      const validatedData = challengeSchema.parse(req.body);
      
      const challenge = await storage.createChallenge({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        duration: validatedData.duration,
        challengeType: validatedData.challengeType,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        createdBy: req.user.id,
        maxParticipants: validatedData.maxParticipants,
        currentParticipants: 0
      });
      
      // Create an activity for the challenge creation
      await storage.createChallengeActivity({
        challengeId: challenge.id,
        userId: req.user.id,
        activityType: 'create',
        data: { timestamp: new Date().toISOString() }
      });
      
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });
  
  app.post("/api/challenges/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if user already joined
      const existing = (await storage.getUserChallengesByChallengeId(challengeId))
        .find(uc => uc.userId === req.user.id);
      
      if (existing) {
        return res.status(400).json({ message: "Already joined this challenge" });
      }
      
      // Check if challenge is full
      if (challenge.maxParticipants !== null && 
          challenge.currentParticipants !== null &&
          challenge.currentParticipants >= challenge.maxParticipants) {
        return res.status(400).json({ message: "Challenge is full" });
      }
      
      // Join the challenge
      const userChallenge = await storage.createUserChallenge({
        challengeId,
        userId: req.user.id,
        progress: 0,
        isCompleted: false
      });
      
      // Increment participant count
      if (challenge.currentParticipants !== null) {
        await storage.updateChallenge(challengeId, {
          currentParticipants: challenge.currentParticipants + 1
        });
      }
      
      // Create activity
      await storage.createChallengeActivity({
        challengeId,
        userId: req.user.id,
        activityType: 'join',
        data: { timestamp: new Date().toISOString() }
      });
      
      res.status(200).json(userChallenge);
    } catch (error) {
      res.status(500).json({ message: "Failed to join challenge" });
    }
  });
  
  app.patch("/api/challenges/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      // Get user's participation in this challenge
      const userChallenges = await storage.getUserChallengesByChallengeId(challengeId);
      const userChallenge = userChallenges.find(uc => uc.userId === req.user.id);
      
      if (!userChallenge) {
        return res.status(404).json({ message: "Not participating in this challenge" });
      }
      
      // Validate input
      const progressSchema = z.object({
        progress: z.number().min(0).max(100),
        completed: z.boolean().optional()
      });
      
      const validatedData = progressSchema.parse(req.body);
      
      // Update progress
      const updatedUserChallenge = await storage.updateUserChallenge(userChallenge.id, {
        progress: validatedData.progress,
        isCompleted: validatedData.completed
      });
      
      // Create activity
      await storage.createChallengeActivity({
        challengeId,
        userId: req.user.id,
        activityType: validatedData.completed ? 'complete' : 'progress_update',
        data: { 
          progress: validatedData.progress,
          timestamp: new Date().toISOString() 
        }
      });
      
      res.json(updatedUserChallenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update progress" });
    }
  });
  
  app.get("/api/challenges/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      const messages = await storage.getChallengeMessages(challengeId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.get("/api/challenges/:id/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      const activities = await storage.getChallengeActivities(challengeId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  app.post("/api/challenges/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const challengeId = parseInt(req.params.id);
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: "Invalid challenge ID" });
    }
    
    try {
      // Check if user is participating in the challenge
      const userChallenges = await storage.getUserChallengesByChallengeId(challengeId);
      const isParticipant = userChallenges.some(uc => uc.userId === req.user.id);
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not participating in this challenge" });
      }
      
      const messageSchema = z.object({
        content: z.string().min(1)
      });
      
      const validatedData = messageSchema.parse(req.body);
      
      const message = await storage.createChallengeMessage({
        challengeId,
        userId: req.user.id,
        content: validatedData.content
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // AI-Generated Goal Recommendations
  app.get("/api/recommendations/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI recommendations are currently unavailable" });
    }
    
    try {
      // Get user's past assessments
      const assessments = await storage.getUserAssessmentsByUserId(req.user.id);
      
      // Get user's recent goals
      const goals = await storage.getGoalsByUserId(req.user.id);
      
      // Get growth data
      const growthData = await storage.getGrowthByUserId(req.user.id);
      
      // Generate AI recommendations
      const recommendations = await generateGoalRecommendations(assessments, goals, growthData);
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });
  
  // Learning Paths API
  app.get("/api/learning-paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const allPaths = await storage.getAllLearningPaths();
      res.json(allPaths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning paths" });
    }
  });
  
  app.get("/api/learning-paths/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { query, category, difficulty } = req.query;
    
    try {
      const results = await storage.searchLearningPaths(
        query as string || "", 
        category as string, 
        difficulty as string
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search learning paths" });
    }
  });
  
  app.get("/api/learning-paths/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const pathId = parseInt(req.params.id);
    if (isNaN(pathId)) {
      return res.status(400).json({ message: "Invalid learning path ID" });
    }
    
    try {
      const path = await storage.getLearningPathWithSteps(pathId);
      
      if (!path) {
        return res.status(404).json({ message: "Learning path not found" });
      }
      
      res.json(path);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning path" });
    }
  });
  
  app.post("/api/learning-paths/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI generation is currently unavailable" });
    }
    
    try {
      const { category, difficulty, focusAreas, durationDays } = req.body;
      
      const generatedPath = await storage.generatePersonalizedLearningPath(
        req.user.id,
        {
          category,
          difficulty,
          focusAreas,
          durationDays: parseInt(durationDays) || 7
        }
      );
      
      res.status(201).json(generatedPath);
    } catch (error) {
      console.error('Error generating learning path:', error);
      res.status(500).json({ message: "Failed to generate learning path" });
    }
  });
  
  app.get("/api/user/learning-paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userPaths = await storage.getUserLearningPathDetailsByUserId(req.user.id);
      res.json(userPaths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user learning paths" });
    }
  });
  
  app.post("/api/learning-paths/:id/enroll", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const pathId = parseInt(req.params.id);
    if (isNaN(pathId)) {
      return res.status(400).json({ message: "Invalid learning path ID" });
    }
    
    try {
      const path = await storage.getLearningPath(pathId);
      
      if (!path) {
        return res.status(404).json({ message: "Learning path not found" });
      }
      
      // Get the first step
      const steps = await storage.getLearningPathSteps(pathId);
      const firstStepId = steps.length > 0 ? steps[0].id : null;
      
      // Enroll user
      const enrollment = await storage.enrollUserInLearningPath({
        userId: req.user.id,
        learningPathId: pathId,
        currentStepId: firstStepId,
        status: 'in_progress',
        progressPercent: 0
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to enroll in learning path" });
    }
  });
  
  app.patch("/api/user/learning-paths/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userLearningPathId = parseInt(req.params.id);
    if (isNaN(userLearningPathId)) {
      return res.status(400).json({ message: "Invalid user learning path ID" });
    }
    
    try {
      const progressSchema = z.object({
        currentStepId: z.number().optional(),
        status: z.string().optional(),
        progressPercent: z.number().min(0).max(100).optional()
      });
      
      const validatedData = progressSchema.parse(req.body);
      
      const updatedPath = await storage.updateUserLearningPathProgress(
        userLearningPathId,
        validatedData
      );
      
      if (!updatedPath) {
        return res.status(404).json({ message: "User learning path not found" });
      }
      
      res.json(updatedPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update progress" });
    }
  });
  
  app.post("/api/user/learning-paths/:id/complete-step", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userLearningPathId = parseInt(req.params.id);
    if (isNaN(userLearningPathId)) {
      return res.status(400).json({ message: "Invalid user learning path ID" });
    }
    
    try {
      const stepSchema = z.object({
        stepId: z.number()
      });
      
      const validatedData = stepSchema.parse(req.body);
      
      const userPath = await storage.getUserLearningPath(userLearningPathId);
      
      if (!userPath) {
        return res.status(404).json({ message: "User learning path not found" });
      }
      
      if (userPath.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this learning path" });
      }
      
      // Mark step as completed
      const completion = await storage.markStepAsCompleted({
        userLearningPathId,
        stepId: validatedData.stepId,
        completedAt: new Date()
      });
      
      res.status(201).json(completion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to complete step" });
    }
  });
}