import { MemStorage } from './storage';
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
import { generateAILearningPath } from './learning-paths';

// Implement Learning Path methods for MemStorage class
export const implementLearningPathMethods = (storage: MemStorage) => {
  // Learning Path methods
  storage.getLearningPath = async (id: number): Promise<LearningPath | undefined> => {
    return storage.learningPaths.get(id);
  };

  storage.getLearningPathWithSteps = async (id: number): Promise<LearningPathWithSteps | undefined> => {
    const path = await storage.getLearningPath(id);
    if (!path) return undefined;

    const steps = await storage.getLearningPathSteps(id);
    
    return {
      ...path,
      steps
    };
  };
  
  storage.getAllLearningPaths = async (): Promise<LearningPath[]> => {
    return Array.from(storage.learningPaths.values());
  };
  
  storage.searchLearningPaths = async (
    query: string, 
    category?: string, 
    difficulty?: string
  ): Promise<LearningPath[]> => {
    let paths = Array.from(storage.learningPaths.values());
    
    // Filter by category if provided
    if (category) {
      paths = paths.filter(path => path.category === category);
    }
    
    // Filter by difficulty if provided
    if (difficulty) {
      paths = paths.filter(path => path.difficulty === difficulty);
    }
    
    // Search by query if provided
    if (query && query.trim() !== '') {
      const normalizedQuery = query.toLowerCase();
      paths = paths.filter(path => 
        path.title.toLowerCase().includes(normalizedQuery) || 
        path.description.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return paths;
  };
  
  storage.createLearningPath = async (learningPath: InsertLearningPath): Promise<LearningPath> => {
    const id = storage.learningPathIdCounter++;
    const createdAt = new Date();
    
    const newPath: LearningPath = { 
      ...learningPath, 
      id, 
      createdAt 
    };
    
    storage.learningPaths.set(id, newPath);
    return newPath;
  };
  
  storage.updateLearningPath = async (
    id: number, 
    learningPath: Partial<LearningPath>
  ): Promise<LearningPath | undefined> => {
    const existingPath = storage.learningPaths.get(id);
    if (!existingPath) return undefined;
    
    const updatedPath = { ...existingPath, ...learningPath };
    storage.learningPaths.set(id, updatedPath);
    
    return updatedPath;
  };
  
  storage.deleteLearningPath = async (id: number): Promise<boolean> => {
    // First delete all steps associated with this path
    const steps = await storage.getLearningPathSteps(id);
    for (const step of steps) {
      await storage.deleteLearningPathStep(step.id);
    }
    
    // Then delete all user enrollments
    const userPaths = Array.from(storage.userLearningPaths.values())
      .filter(up => up.learningPathId === id);
      
    for (const userPath of userPaths) {
      storage.userLearningPaths.delete(userPath.id);
      
      // And delete all completions for those enrollments
      const completions = Array.from(storage.userStepCompletions.values())
        .filter(c => c.userLearningPathId === userPath.id);
        
      for (const completion of completions) {
        storage.userStepCompletions.delete(completion.id);
      }
    }
    
    // Finally delete the path itself
    return storage.learningPaths.delete(id);
  };

  // Learning Path Step methods
  storage.getLearningPathStep = async (id: number): Promise<LearningPathStep | undefined> => {
    return storage.learningPathSteps.get(id);
  };
  
  storage.getLearningPathSteps = async (learningPathId: number): Promise<LearningPathStep[]> => {
    return Array.from(storage.learningPathSteps.values())
      .filter(step => step.learningPathId === learningPathId)
      .sort((a, b) => a.order - b.order);
  };
  
  storage.createLearningPathStep = async (step: InsertLearningPathStep): Promise<LearningPathStep> => {
    const id = storage.learningPathStepIdCounter++;
    
    const newStep: LearningPathStep = { ...step, id };
    storage.learningPathSteps.set(id, newStep);
    
    return newStep;
  };
  
  storage.updateLearningPathStep = async (
    id: number, 
    step: Partial<LearningPathStep>
  ): Promise<LearningPathStep | undefined> => {
    const existingStep = storage.learningPathSteps.get(id);
    if (!existingStep) return undefined;
    
    const updatedStep = { ...existingStep, ...step };
    storage.learningPathSteps.set(id, updatedStep);
    
    return updatedStep;
  };
  
  storage.deleteLearningPathStep = async (id: number): Promise<boolean> => {
    // Delete any completions of this step
    const completions = Array.from(storage.userStepCompletions.values())
      .filter(c => c.stepId === id);
      
    for (const completion of completions) {
      storage.userStepCompletions.delete(completion.id);
    }
    
    // Delete the step
    return storage.learningPathSteps.delete(id);
  };

  // User Learning Path methods
  storage.getUserLearningPath = async (id: number): Promise<UserLearningPath | undefined> => {
    return storage.userLearningPaths.get(id);
  };
  
  storage.getUserLearningPathDetail = async (id: number): Promise<UserLearningPathDetail | undefined> => {
    const userPath = await storage.getUserLearningPath(id);
    if (!userPath) return undefined;
    
    const pathWithSteps = await storage.getLearningPathWithSteps(userPath.learningPathId);
    if (!pathWithSteps) return undefined;
    
    const completions = await storage.getUserStepCompletions(id);
    
    return {
      ...userPath,
      learningPath: pathWithSteps,
      completedSteps: completions
    };
  };
  
  storage.getUserLearningPathsByUserId = async (userId: number): Promise<UserLearningPath[]> => {
    return Array.from(storage.userLearningPaths.values())
      .filter(path => path.userId === userId);
  };
  
  storage.getUserLearningPathDetailsByUserId = async (userId: number): Promise<UserLearningPathDetail[]> => {
    const userPaths = await storage.getUserLearningPathsByUserId(userId);
    const details: UserLearningPathDetail[] = [];
    
    for (const userPath of userPaths) {
      const detail = await storage.getUserLearningPathDetail(userPath.id);
      if (detail) {
        details.push(detail);
      }
    }
    
    return details;
  };
  
  storage.enrollUserInLearningPath = async (enrollment: InsertUserLearningPath): Promise<UserLearningPath> => {
    const id = storage.userLearningPathIdCounter++;
    const enrolledAt = new Date();
    const lastUpdatedAt = new Date();
    
    // Set defaults if not provided
    const status = enrollment.status || 'not_started';
    const progressPercent = enrollment.progressPercent || 0;
    
    const newEnrollment: UserLearningPath = {
      ...enrollment,
      id,
      enrolledAt,
      lastUpdatedAt,
      status,
      progressPercent,
      completedAt: null
    };
    
    storage.userLearningPaths.set(id, newEnrollment);
    return newEnrollment;
  };
  
  storage.updateUserLearningPathProgress = async (
    id: number, 
    updates: { currentStepId?: number; status?: string; progressPercent?: number }
  ): Promise<UserLearningPath | undefined> => {
    const userPath = storage.userLearningPaths.get(id);
    if (!userPath) return undefined;
    
    const updatedPath: UserLearningPath = { 
      ...userPath,
      ...updates,
      lastUpdatedAt: new Date()
    };
    
    // If status is set to completed, add completion date
    if (updates.status === 'completed' && userPath.status !== 'completed') {
      updatedPath.completedAt = new Date();
    }
    
    storage.userLearningPaths.set(id, updatedPath);
    return updatedPath;
  };

  // User Step Completion methods
  storage.getUserStepCompletions = async (userLearningPathId: number): Promise<UserStepCompletion[]> => {
    return Array.from(storage.userStepCompletions.values())
      .filter(completion => completion.userLearningPathId === userLearningPathId);
  };
  
  storage.markStepAsCompleted = async (completion: InsertUserStepCompletion): Promise<UserStepCompletion> => {
    const id = storage.userStepCompletionIdCounter++;
    const completedAt = new Date();
    
    const newCompletion: UserStepCompletion = {
      ...completion,
      id,
      completedAt
    };
    
    storage.userStepCompletions.set(id, newCompletion);
    
    // Update user learning path progress
    const userPath = await storage.getUserLearningPath(completion.userLearningPathId);
    if (userPath) {
      // Get all steps for this learning path
      const steps = await storage.getLearningPathSteps(userPath.learningPathId);
      const completions = await storage.getUserStepCompletions(userPath.userLearningPathId);
      
      // Calculate progress percentage
      const progressPercent = Math.floor((completions.length / steps.length) * 100);
      
      // Find the next step in order
      const completedStepIds = completions.map(c => c.stepId);
      const nextStep = steps
        .filter(s => !completedStepIds.includes(s.id))
        .sort((a, b) => a.order - b.order)[0];
      
      // Determine status based on completion
      let status = userPath.status;
      if (progressPercent === 100) {
        status = 'completed';
      } else if (status === 'not_started') {
        status = 'in_progress';
      }
      
      // Update the user learning path
      await storage.updateUserLearningPathProgress(userPath.id, {
        currentStepId: nextStep?.id,
        status,
        progressPercent
      });
    }
    
    return newCompletion;
  };

  // AI-Generated Learning Path
  storage.generatePersonalizedLearningPath = async (
    userId: number, 
    preferences: { 
      category: string; 
      difficulty: string; 
      focusAreas: string[]; 
      durationDays: number; 
    }
  ): Promise<LearningPathWithSteps> => {
    return generateAILearningPath(userId, preferences, storage);
  };

  return storage;
};