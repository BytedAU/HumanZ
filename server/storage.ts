import { users, goals, assessments, userAssessments, challenges, userChallenges, growth,
  challengeMessages, challengeActivities } from "@shared/schema";
import type { 
  User, InsertUser, 
  Goal, InsertGoal, 
  Assessment, InsertAssessment, 
  UserAssessment, InsertUserAssessment,
  Challenge, InsertChallenge,
  UserChallenge, InsertUserChallenge,
  Growth, InsertGrowth,
  ChallengeMessage, InsertChallengeMessage,
  ChallengeActivity, InsertChallengeActivity
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
import { 
  LearningPath, 
  InsertLearningPath, 
  LearningPathStep, 
  InsertLearningPathStep,
  UserLearningPath,
  InsertUserLearningPath,
  UserStepCompletion,
  InsertUserStepCompletion,
  LearningPathWithSteps,
  UserLearningPathDetail
} from '@shared/learning-path-schema';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Goal methods
  getGoal(id: number): Promise<Goal | undefined>;
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Assessment methods
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  
  // UserAssessment methods
  getUserAssessment(id: number): Promise<UserAssessment | undefined>;
  getUserAssessmentsByUserId(userId: number): Promise<UserAssessment[]>;
  createUserAssessment(userAssessment: InsertUserAssessment): Promise<UserAssessment>;
  
  // Challenge methods
  getChallenge(id: number): Promise<Challenge | undefined>;
  getAllChallenges(): Promise<Challenge[]>;
  getCollaborativeChallenges(): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined>;
  
  // UserChallenge methods
  getUserChallenge(id: number): Promise<UserChallenge | undefined>;
  getUserChallengesByUserId(userId: number): Promise<UserChallenge[]>;
  getUserChallengesByChallengeId(challengeId: number): Promise<UserChallenge[]>;
  createUserChallenge(userChallenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(id: number, userChallenge: Partial<UserChallenge>): Promise<UserChallenge | undefined>;
  
  // Challenge real-time features
  getChallengeMessages(challengeId: number): Promise<ChallengeMessage[]>;
  createChallengeMessage(message: InsertChallengeMessage): Promise<ChallengeMessage>;
  
  getChallengeActivities(challengeId: number, limit?: number): Promise<ChallengeActivity[]>;
  createChallengeActivity(activity: InsertChallengeActivity): Promise<ChallengeActivity>;
  
  // Growth methods
  getGrowthByUserId(userId: number): Promise<Growth[]>;
  getWeeklyGrowthByUserId(userId: number): Promise<Growth[]>;
  createGrowth(growth: InsertGrowth): Promise<Growth>;
  
  // Learning Path methods
  getLearningPath(id: number): Promise<LearningPath | undefined>;
  getLearningPathWithSteps(id: number): Promise<LearningPathWithSteps | undefined>;
  getAllLearningPaths(): Promise<LearningPath[]>;
  searchLearningPaths(query: string, category?: string, difficulty?: string): Promise<LearningPath[]>;
  createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath>;
  updateLearningPath(id: number, learningPath: Partial<LearningPath>): Promise<LearningPath | undefined>;
  deleteLearningPath(id: number): Promise<boolean>;
  
  // Learning Path Step methods
  getLearningPathStep(id: number): Promise<LearningPathStep | undefined>;
  getLearningPathSteps(learningPathId: number): Promise<LearningPathStep[]>;
  createLearningPathStep(step: InsertLearningPathStep): Promise<LearningPathStep>;
  updateLearningPathStep(id: number, step: Partial<LearningPathStep>): Promise<LearningPathStep | undefined>;
  deleteLearningPathStep(id: number): Promise<boolean>;
  
  // User Learning Path methods
  getUserLearningPath(id: number): Promise<UserLearningPath | undefined>;
  getUserLearningPathDetail(id: number): Promise<UserLearningPathDetail | undefined>;
  getUserLearningPathsByUserId(userId: number): Promise<UserLearningPath[]>;
  getUserLearningPathDetailsByUserId(userId: number): Promise<UserLearningPathDetail[]>;
  enrollUserInLearningPath(enrollment: InsertUserLearningPath): Promise<UserLearningPath>;
  updateUserLearningPathProgress(
    id: number, 
    updates: { currentStepId?: number; status?: string; progressPercent?: number }
  ): Promise<UserLearningPath | undefined>;
  
  // User Step Completion methods
  getUserStepCompletions(userLearningPathId: number): Promise<UserStepCompletion[]>;
  markStepAsCompleted(completion: InsertUserStepCompletion): Promise<UserStepCompletion>;
  
  // Generate AI Learning Path
  generatePersonalizedLearningPath(
    userId: number, 
    preferences: { 
      category: string;
      difficulty: string;
      focusAreas: string[];
      durationDays: number;
    }
  ): Promise<LearningPathWithSteps>;
  
  // Session storage
  sessionStore: session.Store;
  
  // Helper method
  seedLearningPaths(): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private assessments: Map<number, Assessment>;
  private userAssessments: Map<number, UserAssessment>;
  private challenges: Map<number, Challenge>;
  private userChallenges: Map<number, UserChallenge>;
  private growthEntries: Map<number, Growth>;
  private learningPaths: Map<number, LearningPath>;
  private learningPathSteps: Map<number, LearningPathStep>;
  private userLearningPaths: Map<number, UserLearningPath>;
  private userStepCompletions: Map<number, UserStepCompletion>;
  private challengeMessages: Map<number, ChallengeMessage>;
  private challengeActivities: Map<number, ChallengeActivity>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private goalIdCounter: number;
  private assessmentIdCounter: number;
  private userAssessmentIdCounter: number;
  private challengeIdCounter: number;
  private userChallengeIdCounter: number;
  private growthIdCounter: number;
  private learningPathIdCounter: number;
  private learningPathStepIdCounter: number;
  private userLearningPathIdCounter: number;
  private userStepCompletionIdCounter: number;
  private challengeMessageIdCounter: number;
  private challengeActivityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.assessments = new Map();
    this.userAssessments = new Map();
    this.challenges = new Map();
    this.userChallenges = new Map();
    this.growthEntries = new Map();
    this.learningPaths = new Map();
    this.learningPathSteps = new Map();
    this.userLearningPaths = new Map();
    this.userStepCompletions = new Map();
    this.challengeMessages = new Map();
    this.challengeActivities = new Map();
    
    this.userIdCounter = 1;
    this.goalIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.userAssessmentIdCounter = 1;
    this.challengeIdCounter = 1;
    this.userChallengeIdCounter = 1;
    this.growthIdCounter = 1;
    this.learningPathIdCounter = 1;
    this.learningPathStepIdCounter = 1;
    this.userLearningPathIdCounter = 1;
    this.userStepCompletionIdCounter = 1;
    this.challengeMessageIdCounter = 1;
    this.challengeActivityIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h in ms
    });
    
    // Initialize with seed data for assessments and challenges
    this.seedAssessments();
    this.seedChallenges();
    // Learning paths will be seeded after method implementation
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isPremium: false,
      createdAt
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Goal methods
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId
    );
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const createdAt = new Date();
    const goal: Goal = { ...insertGoal, id, createdAt };
    this.goals.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalUpdate };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Assessment methods
  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }
  
  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }
  
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const createdAt = new Date();
    const assessment: Assessment = { ...insertAssessment, id, createdAt };
    this.assessments.set(id, assessment);
    return assessment;
  }

  // UserAssessment methods
  async getUserAssessment(id: number): Promise<UserAssessment | undefined> {
    return this.userAssessments.get(id);
  }
  
  async getUserAssessmentsByUserId(userId: number): Promise<UserAssessment[]> {
    return Array.from(this.userAssessments.values()).filter(
      (userAssessment) => userAssessment.userId === userId
    );
  }
  
  async createUserAssessment(insertUserAssessment: InsertUserAssessment): Promise<UserAssessment> {
    const id = this.userAssessmentIdCounter++;
    const completedAt = new Date();
    const userAssessment: UserAssessment = { ...insertUserAssessment, id, completedAt };
    this.userAssessments.set(id, userAssessment);
    return userAssessment;
  }

  // Challenge methods
  async getChallenge(id: number): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }
  
  async getAllChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }
  
  async getCollaborativeChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values())
      .filter(challenge => challenge.challengeType === "collaborative");
  }
  
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = this.challengeIdCounter++;
    const createdAt = new Date();
    
    const challenge: Challenge = { 
      id, 
      createdAt,
      title: insertChallenge.title,
      description: insertChallenge.description || null,
      category: insertChallenge.category,
      duration: insertChallenge.duration,
      startDate: insertChallenge.startDate,
      endDate: insertChallenge.endDate,
      createdBy: insertChallenge.createdBy,
      challengeType: insertChallenge.challengeType || "individual",
      maxParticipants: insertChallenge.maxParticipants || null,
      currentParticipants: insertChallenge.currentParticipants || 0
    };
    
    this.challenges.set(id, challenge);
    return challenge;
  }
  
  async updateChallenge(id: number, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) {
      return undefined;
    }
    
    const updatedChallenge = { ...challenge, ...updates };
    this.challenges.set(id, updatedChallenge);
    
    return updatedChallenge;
  }

  // UserChallenge methods
  async getUserChallenge(id: number): Promise<UserChallenge | undefined> {
    return this.userChallenges.get(id);
  }
  
  async getUserChallengesByUserId(userId: number): Promise<UserChallenge[]> {
    return Array.from(this.userChallenges.values()).filter(
      (userChallenge) => userChallenge.userId === userId
    );
  }
  
  async getUserChallengesByChallengeId(challengeId: number): Promise<UserChallenge[]> {
    return Array.from(this.userChallenges.values()).filter(
      (userChallenge) => userChallenge.challengeId === challengeId
    );
  }
  
  async createUserChallenge(insertUserChallenge: InsertUserChallenge): Promise<UserChallenge> {
    const id = this.userChallengeIdCounter++;
    const joinedAt = new Date();
    const userChallenge: UserChallenge = { ...insertUserChallenge, id, joinedAt };
    this.userChallenges.set(id, userChallenge);
    return userChallenge;
  }
  
  async updateUserChallenge(id: number, userChallengeUpdate: Partial<UserChallenge>): Promise<UserChallenge | undefined> {
    const userChallenge = await this.getUserChallenge(id);
    if (!userChallenge) return undefined;
    
    const updatedUserChallenge = { ...userChallenge, ...userChallengeUpdate };
    this.userChallenges.set(id, updatedUserChallenge);
    return updatedUserChallenge;
  }

  // Growth methods
  async getGrowthByUserId(userId: number): Promise<Growth[]> {
    return Array.from(this.growthEntries.values()).filter(
      (growth) => growth.userId === userId
    );
  }
  
  async getWeeklyGrowthByUserId(userId: number): Promise<Growth[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return Array.from(this.growthEntries.values()).filter(
      (growth) => growth.userId === userId && growth.date >= oneWeekAgo
    );
  }
  
  async createGrowth(insertGrowth: InsertGrowth): Promise<Growth> {
    const id = this.growthIdCounter++;
    const createdAt = new Date();
    const growth: Growth = { ...insertGrowth, id, createdAt };
    this.growthEntries.set(id, growth);
    return growth;
  }
  
  // Challenge real-time features
  async getChallengeMessages(challengeId: number): Promise<ChallengeMessage[]> {
    return Array.from(this.challengeMessages.values())
      .filter(message => message.challengeId === challengeId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createChallengeMessage(message: InsertChallengeMessage): Promise<ChallengeMessage> {
    const id = this.challengeMessageIdCounter++;
    const createdAt = new Date();
    
    const newMessage: ChallengeMessage = {
      id,
      createdAt,
      challengeId: message.challengeId,
      userId: message.userId,
      content: message.content
    };
    
    this.challengeMessages.set(id, newMessage);
    
    // Create an activity entry for this message
    await this.createChallengeActivity({
      challengeId: message.challengeId,
      userId: message.userId,
      activityType: "message",
      data: { messageId: id, content: message.content }
    });
    
    return newMessage;
  }
  
  async getChallengeActivities(challengeId: number, limit = 20): Promise<ChallengeActivity[]> {
    return Array.from(this.challengeActivities.values())
      .filter(activity => activity.challengeId === challengeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // newest first
      .slice(0, limit);
  }
  
  async createChallengeActivity(activity: InsertChallengeActivity): Promise<ChallengeActivity> {
    const id = this.challengeActivityIdCounter++;
    const createdAt = new Date();
    
    const newActivity: ChallengeActivity = {
      id,
      createdAt,
      challengeId: activity.challengeId,
      userId: activity.userId,
      activityType: activity.activityType,
      data: activity.data
    };
    
    this.challengeActivities.set(id, newActivity);
    return newActivity;
  }
  
  // Seed data methods
  private seedAssessments() {
    const sampleQuestions = [
      { id: 1, question: "How effectively do you communicate your ideas to others?", type: "scale", min: 1, max: 10 },
      { id: 2, question: "How comfortable are you with giving constructive feedback?", type: "scale", min: 1, max: 10 },
      { id: 3, question: "How well do you handle high-pressure situations?", type: "scale", min: 1, max: 10 },
      { id: 4, question: "How often do you take initiative on tasks without being asked?", type: "scale", min: 1, max: 10 },
      { id: 5, question: "How well do you recognize and manage your emotions?", type: "scale", min: 1, max: 10 }
    ];
    
    const assessments = [
      {
        title: "Leadership Potential Assessment",
        description: "Evaluate your leadership style and discover growth opportunities.",
        duration: 20,
        questions: sampleQuestions,
        category: "leadership"
      },
      {
        title: "Problem-Solving Skills Test",
        description: "Measure your analytical thinking and decision-making abilities.",
        duration: 15,
        questions: sampleQuestions,
        category: "problem_solving"
      },
      {
        title: "Emotional Intelligence Evaluation",
        description: "Understand your emotional awareness and relationship management skills.",
        duration: 25,
        questions: sampleQuestions,
        category: "emotional_intelligence"
      },
      {
        title: "Creative Thinking Assessment",
        description: "Measure your innovative thinking and problem-solving creativity.",
        duration: 18,
        questions: sampleQuestions,
        category: "creativity"
      }
    ];
    
    assessments.forEach((assessment) => {
      const id = this.assessmentIdCounter++;
      const createdAt = new Date();
      this.assessments.set(id, { ...assessment, id, createdAt });
    });
  }
  
  private seedChallenges() {
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const sixtyDaysLater = new Date(now);
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
    
    // Events in San Francisco in 2025
    const sfEventStart = new Date('2025-06-01');
    const sfEventEnd = new Date('2025-09-01');
    
    const challenges = [
      {
        title: "30-Day Learning Challenge",
        description: "Learn something new every day for 30 days. Share your progress with the community.",
        category: "educational",
        duration: 30,
        startDate: now,
        endDate: thirtyDaysLater,
        createdBy: 0, // System created
        challengeType: "individual",
        maxParticipants: null,
        currentParticipants: 0
      },
      {
        title: "Book Reading Marathon",
        description: "Read 5 books in 2 months and discuss key takeaways with others.",
        category: "personal",
        duration: 60,
        startDate: now,
        endDate: sixtyDaysLater,
        createdBy: 0, // System created
        challengeType: "individual",
        maxParticipants: null,
        currentParticipants: 0
      },
      {
        title: "San Francisco Social Explorer Challenge",
        description: "Discover San Francisco's vibrant social scene with a group of like-minded explorers. " +
                     "Join local events, food festivals, and cultural gatherings throughout summer 2025. " +
                     "Members share recommendations, coordinate meetups, and document their experiences.",
        category: "social",
        duration: 92, // 3 months
        startDate: sfEventStart,
        endDate: sfEventEnd,
        createdBy: 0, // System created
        challengeType: "collaborative",
        maxParticipants: 20,
        currentParticipants: 1
      }
    ];
    
    challenges.forEach((challenge) => {
      const id = this.challengeIdCounter++;
      const createdAt = new Date();
      this.challenges.set(id, { ...challenge, id, createdAt });
      
      // Add initial activity for SF challenge
      if (challenge.title === "San Francisco Social Explorer Challenge") {
        this.challengeActivities.set(this.challengeActivityIdCounter++, {
          id: this.challengeActivityIdCounter,
          challengeId: id,
          userId: 0, // System
          activityType: "milestone",
          data: { 
            title: "Challenge Created", 
            description: "The San Francisco Social Explorer Challenge has been launched! Join to discover SF's vibrant scene in summer 2025."
          },
          createdAt: new Date()
        });
      }
    });
  }
}

export const storage = new MemStorage();
