import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateAssessmentFeedback, generateGrowthInsights, generateGoalRecommendations } from "./openai";
import { implementLearningPathMethods } from "./storage-methods";
import { z } from "zod";
import { WebSocketServer, WebSocket } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize learning path methods
  implementLearningPathMethods(storage);
  
  // Set up authentication routes
  setupAuth(app);

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
        description: validatedData.description,
        category: validatedData.category,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
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

  app.put("/api/goals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this goal" });
      }
      
      const updateSchema = z.object({
        title: z.string().min(3).max(100).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        deadline: z.string().optional(), // ISO date string
        priority: z.string().optional(), // low, medium, high
        progress: z.number().min(0).max(100).optional(),
        isCompleted: z.boolean().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // If deadline is provided, convert to Date
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
    
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this goal" });
      }
      
      const success = await storage.deleteGoal(goalId);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete goal" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Assessments API
  app.get("/api/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.post("/api/assessments/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const answersSchema = z.array(
        z.object({
          questionId: z.number(),
          answer: z.number().min(1).max(10)
        })
      );
      
      const validatedData = answersSchema.parse(req.body.answers);
      
      // Generate AI feedback
      const feedback = await generateAssessmentFeedback(assessment.category, validatedData);
      
      // Save assessment results
      const userAssessment = await storage.createUserAssessment({
        userId: req.user.id,
        assessmentId: assessmentId,
        score: feedback.overallScore,
        results: feedback
      });
      
      res.status(201).json({
        userAssessment,
        feedback
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to complete assessment" });
    }
  });

  app.get("/api/user-assessments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userAssessments = await storage.getUserAssessmentsByUserId(req.user.id);
      res.json(userAssessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assessment results" });
    }
  });

  // Challenges API
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const challengeSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().optional(),
        category: z.string(),
        duration: z.number().min(1),
        startDate: z.string(), // ISO date string
        endDate: z.string() // ISO date string
      });
      
      const validatedData = challengeSchema.parse(req.body);
      
      const challenge = await storage.createChallenge({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        duration: validatedData.duration,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        createdBy: req.user.id
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
    
    try {
      const challengeId = parseInt(req.params.id);
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      // Check if user already joined
      const userChallenges = await storage.getUserChallengesByUserId(req.user.id);
      const alreadyJoined = userChallenges.find(uc => uc.challengeId === challengeId);
      
      if (alreadyJoined) {
        return res.status(400).json({ message: "Already joined this challenge" });
      }
      
      const userChallenge = await storage.createUserChallenge({
        userId: req.user.id,
        challengeId: challengeId,
        progress: 0,
        isCompleted: false
      });
      
      res.status(201).json(userChallenge);
    } catch (error) {
      res.status(500).json({ message: "Failed to join challenge" });
    }
  });

  app.get("/api/user-challenges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userChallenges = await storage.getUserChallengesByUserId(req.user.id);
      
      // Get full challenge details for each user challenge
      const challengeDetails = await Promise.all(
        userChallenges.map(async (uc) => {
          const challenge = await storage.getChallenge(uc.challengeId);
          return {
            ...uc,
            challenge
          };
        })
      );
      
      res.json(challengeDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  app.put("/api/user-challenges/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userChallengeId = parseInt(req.params.id);
      const userChallenge = await storage.getUserChallenge(userChallengeId);
      
      if (!userChallenge) {
        return res.status(404).json({ message: "User challenge not found" });
      }
      
      if (userChallenge.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this challenge" });
      }
      
      const updateSchema = z.object({
        progress: z.number().min(0).max(100).optional(),
        isCompleted: z.boolean().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const updatedUserChallenge = await storage.updateUserChallenge(userChallengeId, validatedData);
      res.json(updatedUserChallenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update challenge progress" });
    }
  });

  // Growth API
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
      res.json(weeklyGrowth);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly growth data" });
    }
  });

  app.post("/api/growth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const growthSchema = z.object({
        date: z.string(), // ISO date string
        value: z.number(),
        category: z.string()
      });
      
      const validatedData = growthSchema.parse(req.body);
      
      const growth = await storage.createGrowth({
        userId: req.user.id,
        date: new Date(validatedData.date),
        value: validatedData.value,
        category: validatedData.category
      });
      
      res.status(201).json(growth);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to record growth" });
    }
  });

  // AI Insights API
  app.get("/api/insights/growth", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const growthData = await storage.getGrowthByUserId(req.user.id);
      
      if (growthData.length === 0) {
        return res.json({
          trends: ["Not enough data to analyze trends yet"],
          patterns: ["Start tracking your growth to see patterns"],
          recommendations: [
            "Set up your first goal",
            "Take an assessment to establish a baseline",
            "Join a challenge to kick-start your growth"
          ]
        });
      }
      
      const insights = await generateGrowthInsights(growthData);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate growth insights" });
    }
  });

  app.get("/api/insights/goals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const goals = await storage.getGoalsByUserId(req.user.id);
      
      const currentGoals = goals.map(goal => ({
        title: goal.title,
        category: goal.category,
        progress: goal.progress
      }));
      
      const userInterests = ["personal growth", "learning", "productivity"]; // Default interests
      
      const recommendations = await generateGoalRecommendations(currentGoals, userInterests);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate goal recommendations" });
    }
  });

  // Leaderboard API
  app.get("/api/leaderboard", async (req, res) => {
    try {
      // This is a simplified leaderboard implementation
      // In a real app, we would calculate this from actual growth data
      
      // Sample leaderboard data
      const leaderboard = [
        { id: 1, username: "emma_thompson", name: "Emma Thompson", avatar: null, growth: 42, category: "leadership" },
        { id: 2, username: "michael_chen", name: "Michael Chen", avatar: null, growth: 38, category: "data_science" },
        { id: 3, username: "sarah_johnson", name: "Sarah Johnson", avatar: null, growth: 35, category: "creative" },
        { id: 4, username: "david_wilson", name: "David Wilson", avatar: null, growth: 29, category: "product" },
        { id: 5, username: "jessica_lee", name: "Jessica Lee", avatar: null, growth: 27, category: "design" }
      ];
      
      // If user is authenticated, add their position
      if (req.isAuthenticated()) {
        const userPosition = {
          id: req.user.id,
          username: req.user.username,
          name: req.user.name,
          avatar: req.user.avatar,
          growth: 12,
          category: "software",
          position: 24 // Random position
        };
        
        res.json({ leaderboard, userPosition });
      } else {
        res.json({ leaderboard });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });
  
  // Learning Paths API
  
  // Seed some initial learning paths if needed (only in development)
  if (process.env.NODE_ENV === 'development') {
    storage.seedLearningPaths();
  }
  
  // Get all learning paths
  app.get("/api/learning-paths", async (req, res) => {
    try {
      const learningPaths = await storage.getAllLearningPaths();
      res.json(learningPaths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning paths" });
    }
  });
  
  // Search learning paths
  app.get("/api/learning-paths/search", async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const category = req.query.category as string;
      const difficulty = req.query.difficulty as string;
      
      const learningPaths = await storage.searchLearningPaths(query, category, difficulty);
      res.json(learningPaths);
    } catch (error) {
      res.status(500).json({ message: "Failed to search learning paths" });
    }
  });
  
  // Get single learning path with steps
  app.get("/api/learning-paths/:id", async (req, res) => {
    try {
      const pathId = parseInt(req.params.id);
      const learningPath = await storage.getLearningPathWithSteps(pathId);
      
      if (!learningPath) {
        return res.status(404).json({ message: "Learning path not found" });
      }
      
      res.json(learningPath);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning path" });
    }
  });
  
  // Create a learning path (authenticated users only)
  app.post("/api/learning-paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pathSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string().min(10),
        category: z.string(),
        difficulty: z.string(),
        estimatedDurationDays: z.number().int().positive(),
        thumbnailUrl: z.string().url().nullable().optional()
      });
      
      const validatedData = pathSchema.parse(req.body);
      
      const learningPath = await storage.createLearningPath({
        ...validatedData,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        isAiGenerated: false,
        createdByUserId: req.user.id
      });
      
      res.status(201).json(learningPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create learning path" });
    }
  });
  
  // Create a learning path step (authenticated users only)
  app.post("/api/learning-paths/:id/steps", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pathId = parseInt(req.params.id);
      const path = await storage.getLearningPath(pathId);
      
      if (!path) {
        return res.status(404).json({ message: "Learning path not found" });
      }
      
      // Check if user is the creator of the learning path
      if (path.createdByUserId !== req.user.id) {
        return res.status(403).json({ message: "You can only add steps to your own learning paths" });
      }
      
      const stepSchema = z.object({
        title: z.string().min(3).max(100),
        description: z.string(),
        order: z.number().int().nonnegative(),
        stepType: z.string(),
        content: z.string(),
        estimatedMinutes: z.number().int().positive(),
        resourceUrl: z.string().url().nullable().optional()
      });
      
      const validatedData = stepSchema.parse(req.body);
      
      const step = await storage.createLearningPathStep({
        ...validatedData,
        learningPathId: pathId,
        resourceUrl: validatedData.resourceUrl || null
      });
      
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create learning path step" });
    }
  });
  
  // Generate an AI learning path (authenticated users only)
  app.post("/api/learning-paths/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const preferencesSchema = z.object({
        category: z.string(),
        difficulty: z.string(),
        focusAreas: z.array(z.string()),
        durationDays: z.number().int().positive()
      });
      
      const validatedData = preferencesSchema.parse(req.body);
      
      const learningPath = await storage.generatePersonalizedLearningPath(
        req.user.id,
        validatedData
      );
      
      res.status(201).json(learningPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ 
        message: "Failed to generate learning path",
        error: error.message 
      });
    }
  });
  
  // User Learning Paths API
  
  // Get user's enrolled learning paths
  app.get("/api/user/learning-paths", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userLearningPaths = await storage.getUserLearningPathDetailsByUserId(req.user.id);
      res.json(userLearningPaths);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user learning paths" });
    }
  });
  
  // Enroll in a learning path
  app.post("/api/learning-paths/:id/enroll", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pathId = parseInt(req.params.id);
      const path = await storage.getLearningPath(pathId);
      
      if (!path) {
        return res.status(404).json({ message: "Learning path not found" });
      }
      
      // Get first step to set as current
      const steps = await storage.getLearningPathSteps(pathId);
      const firstStep = steps.length > 0 ? steps[0] : null;
      
      // Create enrollment
      const enrollment = await storage.enrollUserInLearningPath({
        userId: req.user.id,
        learningPathId: pathId,
        status: "not_started",
        progressPercent: 0,
        currentStepId: firstStep?.id || null
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to enroll in learning path" });
    }
  });
  
  // Update progress in a learning path
  app.put("/api/user/learning-paths/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userLearningPathId = parseInt(req.params.id);
      const userLearningPath = await storage.getUserLearningPath(userLearningPathId);
      
      if (!userLearningPath) {
        return res.status(404).json({ message: "User learning path not found" });
      }
      
      if (userLearningPath.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this learning path" });
      }
      
      const updateSchema = z.object({
        status: z.string().optional(),
        currentStepId: z.number().int().nullable().optional(),
        progressPercent: z.number().min(0).max(100).optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const updatedUserLearningPath = await storage.updateUserLearningPathProgress(
        userLearningPathId,
        validatedData
      );
      
      res.json(updatedUserLearningPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update learning path progress" });
    }
  });
  
  // Mark a step as completed
  app.post("/api/user/learning-paths/:pathId/steps/:stepId/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userLearningPathId = parseInt(req.params.pathId);
      const stepId = parseInt(req.params.stepId);
      
      const userLearningPath = await storage.getUserLearningPath(userLearningPathId);
      
      if (!userLearningPath) {
        return res.status(404).json({ message: "User learning path not found" });
      }
      
      if (userLearningPath.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this learning path" });
      }
      
      const completionSchema = z.object({
        notes: z.string().optional(),
        rating: z.number().min(1).max(5).optional()
      });
      
      const validatedData = completionSchema.parse(req.body);
      
      const completion = await storage.markStepAsCompleted({
        userLearningPathId,
        stepId,
        notes: validatedData.notes || null,
        rating: validatedData.rating || null
      });
      
      res.status(201).json(completion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to mark step as completed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
