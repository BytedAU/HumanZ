// Implementation of learning path methods for MemStorage
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
import { OpenAI } from 'openai';

// Initialize OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Sample learning path difficulty descriptions for AI
const difficultyDescriptions = {
  beginner: "Fundamental concepts for those new to the subject",
  intermediate: "Builds on basic knowledge with more detailed concepts",
  advanced: "Requires solid foundation and introduces complex topics",
  expert: "Depth and nuance for those seeking mastery in the field"
};

// Category descriptions for AI to understand the domains
const categoryDescriptions = {
  cognitive: "Mental processes including attention, memory, problem-solving, creativity, and decision-making",
  emotional: "Understanding, managing, and expressing emotions effectively",
  physical: "Physical health, fitness, nutrition, and wellness practices",
  social: "Interpersonal skills, relationships, communication, and group dynamics",
  professional: "Career growth, leadership, productivity, and workplace skills",
  spiritual: "Meaning, purpose, values, and connection to something greater than oneself"
};

// Learning path methods
export function implementLearningPathMethods(storage: MemStorage) {
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
      createdAt,
      thumbnailUrl: learningPath.thumbnailUrl || null
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
    
    const newStep: LearningPathStep = { 
      ...step, 
      id,
      resourceUrl: step.resourceUrl || null 
    };
    
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
      completedAt: null,
      currentStepId: enrollment.currentStepId || null
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
      ...(updates.currentStepId !== undefined ? { currentStepId: updates.currentStepId } : {}),
      ...(updates.status !== undefined ? { status: updates.status as any } : {}),
      ...(updates.progressPercent !== undefined ? { progressPercent: updates.progressPercent } : {}),
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
      completedAt,
      notes: completion.notes || null,
      rating: completion.rating || null
    };
    
    storage.userStepCompletions.set(id, newCompletion);
    
    // Update user learning path progress
    const userPath = await storage.getUserLearningPath(completion.userLearningPathId);
    if (userPath) {
      // Get all steps for this learning path
      const steps = await storage.getLearningPathSteps(userPath.learningPathId);
      const completions = await storage.getUserStepCompletions(userPath.id);
      
      // Calculate progress percentage
      const progressPercent = Math.floor((completions.length / steps.length) * 100);
      
      // Find the next step in order
      const completedStepIds = completions.map(c => c.stepId);
      const nextSteps = steps
        .filter(s => !completedStepIds.includes(s.id))
        .sort((a, b) => a.order - b.order);
      
      const nextStep = nextSteps.length > 0 ? nextSteps[0] : null;
      
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
    try {
      // Get user data to personalize the learning path
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      // Get user's assessment data if available for more personalization
      const userAssessments = await storage.getUserAssessmentsByUserId(userId);
      
      // Get user's goals for alignment
      const userGoals = await storage.getGoalsByUserId(userId);
      
      // If OpenAI API key is not available, create a simpler learning path
      if (!openai) {
        return createSimpleLearningPath(userId, preferences, storage);
      }
      
      // Build prompt for OpenAI with all relevant personalization data
      const prompt = `
Create a personalized learning path for a user with the following details:
  
User Profile:
- Name: ${user.name}
- Personal Interests: ${user.bio || 'Not specified'}
  
Learning Path Requirements:
- Category: ${preferences.category} (${categoryDescriptions[preferences.category as keyof typeof categoryDescriptions]})
- Difficulty Level: ${preferences.difficulty} (${difficultyDescriptions[preferences.difficulty as keyof typeof difficultyDescriptions]})
- Specific Focus Areas: ${preferences.focusAreas.join(', ')}
- Duration: ${preferences.durationDays} days
  
${userAssessments.length > 0 ? `
Assessment Results:
${userAssessments.map(ua => `- ${ua.assessmentId}: Score ${ua.score}, Completed on ${ua.completedAt.toISOString().split('T')[0]}`).join('\n')}
` : ''}
  
${userGoals.length > 0 ? `
User Goals:
${userGoals.map(goal => `- ${goal.title}: ${goal.description || 'No description'} (Category: ${goal.category})`).join('\n')}
` : ''}
  
Based on this information, create a comprehensive learning path with the following:
  
1. A title that reflects the focus and level
2. A detailed description of what the learner will achieve
3. Between 5-10 logical steps that build progressively
4. For each step, include:
   - A clear title
   - A detailed description of what to learn/practice
   - Estimated time to complete in minutes
   - Type of activity (reading, exercise, reflection, etc.)
   - Specific content or instructions
   - Optional: A resource URL if relevant
  
Return the data as a JSON object with this structure:
{
  "learningPath": {
    "title": string,
    "description": string,
    "category": string (one of: "cognitive", "emotional", "physical", "social", "professional", "spiritual"),
    "difficulty": string (one of: "beginner", "intermediate", "advanced", "expert"),
    "estimatedDurationDays": number,
    "thumbnailUrl": null
  },
  "steps": [
    {
      "title": string,
      "description": string,
      "order": number,
      "stepType": string,
      "content": string,
      "estimatedMinutes": number,
      "resourceUrl": string or null
    }
  ]
}
`;
  
      // Call OpenAI API to generate the learning path
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an expert in personal development, education, and learning design. You create personalized learning paths that are practical, engaging, and effective."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });
  
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }
  
      // Parse the JSON response
      const data = JSON.parse(content);
      
      // Create the learning path in the database
      const newLearningPath = await storage.createLearningPath({
        ...data.learningPath,
        isAiGenerated: true,
        createdByUserId: userId
      });
  
      // Create all the steps in the database
      const steps: LearningPathStep[] = [];
      for (const stepData of data.steps) {
        const newStep = await storage.createLearningPathStep({
          ...stepData,
          learningPathId: newLearningPath.id
        });
        steps.push(newStep);
      }
  
      // Return the combined learning path with steps
      return {
        ...newLearningPath,
        steps
      };
    } catch (error) {
      console.error('Error generating learning path:', error);
      // If there's an error with OpenAI, fall back to a simpler method
      return createSimpleLearningPath(userId, preferences, storage);
    }
  };

  // Helper function to create a simple learning path without AI
  async function createSimpleLearningPath(
    userId: number,
    preferences: {
      category: string;
      difficulty: string;
      focusAreas: string[];
      durationDays: number;
    },
    storage: MemStorage
  ): Promise<LearningPathWithSteps> {
    // Create templates based on category
    const templates: Record<string, {
      title: string;
      description: string;
      steps: Array<{
        title: string;
        description: string;
        order: number;
        stepType: string;
        content: string;
        estimatedMinutes: number;
        resourceUrl: string | null;
      }>;
    }> = {
      cognitive: {
        title: "Cognitive Enhancement Program",
        description: "A structured approach to improve your cognitive abilities including memory, focus, critical thinking, and problem-solving skills.",
        steps: [
          {
            title: "Understanding Your Cognitive Style",
            description: "Assess your current cognitive strengths and weaknesses.",
            order: 1,
            stepType: "assessment",
            content: "Complete a self-assessment to identify your cognitive profile, learning style, and areas for improvement. This will help tailor the rest of the program to your needs.",
            estimatedMinutes: 30,
            resourceUrl: null
          },
          {
            title: "Building a Memory Palace",
            description: "Learn the ancient technique of memory palaces to improve recall.",
            order: 2,
            stepType: "practice",
            content: "In this exercise, you'll create your first memory palace: a mental structure you can use to store and retrieve information. Choose a familiar location (your home, a familiar route), identify 10 distinct locations within it, and practice associating information with these locations.",
            estimatedMinutes: 45,
            resourceUrl: null
          },
          {
            title: "Focus Training",
            description: "Techniques to improve concentration and reduce distractions.",
            order: 3,
            stepType: "exercise",
            content: "Start with a 5-minute focused breathing session. Then practice the Pomodoro Technique: work intensely for 25 minutes, then take a 5-minute break. Complete 3 cycles, tracking what distracts you and how quickly you can return to focus.",
            estimatedMinutes: 90,
            resourceUrl: null
          },
          {
            title: "Critical Thinking Framework",
            description: "Learn the SOCRATIC method for better analysis and decision-making.",
            order: 4,
            stepType: "reading",
            content: "Study the SOCRATIC questioning framework (Significance, Obstacles, Clarity, Relevance, Associations, Terminology, Information, Confirmation) and apply it to a recent decision or belief you hold.",
            estimatedMinutes: 60,
            resourceUrl: null
          },
          {
            title: "Problem-Solving Practice",
            description: "Apply structured techniques to real-world problems.",
            order: 5,
            stepType: "application",
            content: "Choose a real problem you're facing. Apply the 5-step problem-solving process: 1) Define the problem clearly, 2) Generate multiple solutions, 3) Evaluate each solution objectively, 4) Create an implementation plan, 5) Reflect on the process.",
            estimatedMinutes: 90,
            resourceUrl: null
          }
        ]
      },
      emotional: {
        title: "Emotional Intelligence Development",
        description: "Develop skills to understand, manage, and express emotions effectively to improve relationships and personal wellbeing.",
        steps: [
          {
            title: "Emotion Awareness Journal",
            description: "Begin tracking and identifying your emotional patterns.",
            order: 1,
            stepType: "practice",
            content: "Start an emotion journal to track your feelings throughout the day. Three times daily, note: 1) What emotion are you feeling? 2) What triggered it? 3) How intense is it (1-10)? 4) How is your body responding? 5) What thoughts accompany this emotion?",
            estimatedMinutes: 30,
            resourceUrl: null
          },
          {
            title: "Understanding Emotional Triggers",
            description: "Identify patterns in what causes strong emotional responses.",
            order: 2,
            stepType: "reflection",
            content: "Review your journal entries from the past few days. Look for patterns in your emotional triggers. Create a list of your top 5 emotional triggers and reflect on their origins. Consider: Is there a common theme? Do they relate to certain needs or values?",
            estimatedMinutes: 45,
            resourceUrl: null
          },
          {
            title: "Emotional Regulation Techniques",
            description: "Learn methods to manage intense emotions effectively.",
            order: 3,
            stepType: "skill-building",
            content: "Practice three key regulation techniques: 1) Box Breathing (4-count inhale, hold, exhale, hold), 2) 5-4-3-2-1 Grounding (identify things you can see, touch, hear, smell, taste), 3) Cognitive reframing (challenge negative thoughts).",
            estimatedMinutes: 60,
            resourceUrl: null
          },
          {
            title: "Empathy Development",
            description: "Strengthen your ability to understand others' perspectives.",
            order: 4,
            stepType: "exercise",
            content: "Choose a recent disagreement or misunderstanding. Write out the situation from the other person's perspective as charitably as possible. What might they have been feeling? What needs might they have been trying to meet? How might your actions have appeared from their viewpoint?",
            estimatedMinutes: 40,
            resourceUrl: null
          },
          {
            title: "Emotional Expression Practice",
            description: "Learn to express emotions constructively.",
            order: 5,
            stepType: "application",
            content: "Practice using 'I-statements' to express emotions: 'I feel [emotion] when [situation] because [explanation].' Draft responses to 3 challenging scenarios using this framework. Consider how this approach differs from accusatory or blame-focused communication.",
            estimatedMinutes: 50,
            resourceUrl: null
          }
        ]
      },
      physical: {
        title: "Holistic Physical Wellness Program",
        description: "An integrated approach to physical health combining movement, nutrition, and recovery practices.",
        steps: [
          {
            title: "Physical Baseline Assessment",
            description: "Establish your current physical health metrics.",
            order: 1,
            stepType: "assessment",
            content: "Complete a holistic self-assessment including: resting heart rate, perceived energy levels, basic strength measures (push-ups, planks, squats), flexibility test, and sleep quality rating. Record your results to track progress over time.",
            estimatedMinutes: 40,
            resourceUrl: null
          },
          {
            title: "Foundational Movement Patterns",
            description: "Learn proper form for essential human movements.",
            order: 2,
            stepType: "skill-building",
            content: "Practice the six foundational movement patterns with proper form: squat, hinge, push, pull, rotate, and gait (walking/running). Focus on body alignment, breathing, and core engagement during each movement.",
            estimatedMinutes: 60,
            resourceUrl: null
          },
          {
            title: "Nutrition Fundamentals",
            description: "Establish principles for balanced nutrition.",
            order: 3,
            stepType: "learning",
            content: "Learn the basics of nutrition: macronutrients (protein, carbs, fats), micronutrients (vitamins, minerals), hydration, and portion awareness. Create a simple meal template focusing on whole foods, lean proteins, vegetables, fruits, and healthy fats.",
            estimatedMinutes: 50,
            resourceUrl: null
          },
          {
            title: "Recovery Practices",
            description: "Implement techniques for optimal recovery and stress management.",
            order: 4,
            stepType: "practice",
            content: "Experience three recovery modalities: 1) Progressive muscle relaxation (15 min), 2) Mobility flow focusing on tight areas (15 min), 3) Sleep hygiene optimization (create a pre-sleep routine and sleep environment assessment).",
            estimatedMinutes: 50,
            resourceUrl: null
          },
          {
            title: "Sustainable Routine Design",
            description: "Create a personalized physical wellness plan.",
            order: 5,
            stepType: "planning",
            content: "Design a sustainable weekly physical wellness plan incorporating movement, nutrition, and recovery. Include 3-5 movement sessions, daily nutrition guidelines, and recovery practices. Focus on consistency and enjoyability rather than intensity.",
            estimatedMinutes: 60,
            resourceUrl: null
          }
        ]
      },
      social: {
        title: "Social Connection Mastery",
        description: "Develop skills to build deeper relationships and navigate social situations with confidence.",
        steps: [
          {
            title: "Social Strengths and Growth Areas",
            description: "Identify your social patterns, strengths, and challenges.",
            order: 1,
            stepType: "assessment",
            content: "Complete a social skills self-assessment covering: conversation comfort, active listening, assertiveness, empathy, conflict resolution, and relationship maintenance. Identify 2-3 strengths to leverage and 2-3 areas for improvement.",
            estimatedMinutes: 40,
            resourceUrl: null
          },
          {
            title: "Active Listening Practice",
            description: "Develop deeper listening skills for better connections.",
            order: 2,
            stepType: "exercise",
            content: "Practice the HEAR method of active listening: Hold space (remove distractions), Engage fully (make eye contact, nod), Affirm understanding (paraphrase), and Respond thoughtfully. Practice with a friend or family member for 20 minutes on a meaningful topic.",
            estimatedMinutes: 50,
            resourceUrl: null
          },
          {
            title: "Conversation Confidence",
            description: "Build skills for engaging, balanced conversations.",
            order: 3,
            stepType: "skill-building",
            content: "Learn and practice the ARE conversation technique: Ask open questions, Reveal something about yourself, and Express genuine interest. Prepare 5 open-ended questions and practice transitioning between these elements smoothly.",
            estimatedMinutes: 45,
            resourceUrl: null
          },
          {
            title: "Boundary Setting Foundations",
            description: "Learn to establish and communicate healthy boundaries.",
            order: 4,
            stepType: "learning",
            content: "Understand the basics of healthy boundaries: types of boundaries (physical, emotional, time, etc.), signs of boundary violations, and assertive boundary communication. Create a personal boundary inventory identifying where you need stronger boundaries.",
            estimatedMinutes: 55,
            resourceUrl: null
          },
          {
            title: "Relationship Nurturing Plan",
            description: "Develop strategies to maintain and deepen important relationships.",
            order: 5,
            stepType: "planning",
            content: "Create a relationship cultivation plan for 3-5 key relationships. For each person, identify: communication preferences, quality time activities, appreciation methods, and specific actions to strengthen the connection over the next month.",
            estimatedMinutes: 60,
            resourceUrl: null
          }
        ]
      },
      professional: {
        title: "Professional Excellence Pathway",
        description: "A structured approach to elevate your career performance, leadership capabilities, and workplace effectiveness.",
        steps: [
          {
            title: "Professional Skills Inventory",
            description: "Evaluate your current professional capabilities and growth areas.",
            order: 1,
            stepType: "assessment",
            content: "Complete a comprehensive self-assessment of your professional skills across domains: technical skills, communication, leadership, time management, project management, and interpersonal effectiveness. Identify your top 3 strengths and 3 development priorities.",
            estimatedMinutes: 50,
            resourceUrl: null
          },
          {
            title: "Productivity System Implementation",
            description: "Establish an effective personal productivity framework.",
            order: 2,
            stepType: "system-building",
            content: "Implement a productivity system combining task management, prioritization, and focus techniques. Create a weekly planning template, daily prioritization routine, and environment optimization plan. Practice the system for at least one work session.",
            estimatedMinutes: 70,
            resourceUrl: null
          },
          {
            title: "Strategic Communication",
            description: "Enhance your ability to communicate with clarity and impact.",
            order: 3,
            stepType: "skill-building",
            content: "Learn the PREP method (Point, Reason, Example, Point) for structured communication. Practice crafting clear messages for different scenarios: advocating for an idea, delivering project updates, providing feedback, and making requests.",
            estimatedMinutes: 60,
            resourceUrl: null
          },
          {
            title: "Influence and Persuasion",
            description: "Develop techniques to build buy-in and support for your ideas.",
            order: 4,
            stepType: "learning",
            content: "Study the six principles of influence (reciprocity, commitment/consistency, social proof, authority, liking, scarcity) and how to apply them ethically. For an upcoming situation where you need to build support, create an influence strategy using these principles.",
            estimatedMinutes: 55,
            resourceUrl: null
          },
          {
            title: "Career Advancement Planning",
            description: "Create a strategic plan for your professional growth.",
            order: 5,
            stepType: "planning",
            content: "Develop a 6-month career advancement plan including: 1) Specific skills to develop, 2) Visibility opportunities to pursue, 3) Network relationships to cultivate, 4) Projects/results to achieve, and 5) Feedback mechanisms to implement. Set measurable goals for each area.",
            estimatedMinutes: 75,
            resourceUrl: null
          }
        ]
      },
      spiritual: {
        title: "Meaning and Purpose Exploration",
        description: "A journey to discover deeper meaning, personal values, and connection with something greater than yourself.",
        steps: [
          {
            title: "Values Clarification",
            description: "Identify and prioritize your core personal values.",
            order: 1,
            stepType: "reflection",
            content: "Complete a values identification exercise. Review a list of common values (e.g., connection, creativity, freedom, achievement) and select your top 10. Narrow these to your essential 5, then rank them. For each, write why it matters to you and how it manifests in your life currently.",
            estimatedMinutes: 60,
            resourceUrl: null
          },
          {
            title: "Contemplative Practice Introduction",
            description: "Explore mindfulness and present-moment awareness.",
            order: 2,
            stepType: "practice",
            content: "Begin a basic mindfulness meditation practice. Start with 5-10 minutes daily, focusing on your breath and observing thoughts without judgment. Keep a brief journal noting observations, challenges, and insights from your practice.",
            estimatedMinutes: 30,
            resourceUrl: null
          },
          {
            title: "Life Purpose Exploration",
            description: "Investigate what gives your life meaning and direction.",
            order: 3,
            stepType: "reflection",
            content: "Complete three purpose-finding exercises: 1) The 'Peak Experiences' inventory (identify moments when you felt most alive and analyze patterns), 2) The 'Admiration Reflection' (consider who you admire and why), 3) The Legacy Question (what contribution do you want to make?)",
            estimatedMinutes: 70,
            resourceUrl: null
          },
          {
            title: "Gratitude Cultivation",
            description: "Develop a regular practice of appreciation and perspective.",
            order: 4,
            stepType: "practice",
            content: "Establish a daily gratitude practice. Each day, write down 3 things you're grateful for, being specific about why each matters to you. Once weekly, write a short gratitude letter (whether sent or unsent) to someone who has positively impacted your life.",
            estimatedMinutes: 20,
            resourceUrl: null
          },
          {
            title: "Aligning Actions with Values",
            description: "Create practical ways to embody your values in daily life.",
            order: 5,
            stepType: "planning",
            content: "For each of your top 5 values, identify: 1) One daily practice that expresses this value, 2) One weekly action that deepens this value, 3) One monthly commitment that advances this value. Create a simple tracking system to monitor your alignment.",
            estimatedMinutes: 60,
            resourceUrl: null
          }
        ]
      }
    };
    
    // Get the appropriate template
    const template = templates[preferences.category] || templates.cognitive;
    
    // Adapt the template based on difficulty
    const difficultyMultiplier = {
      beginner: 0.8,
      intermediate: 1,
      advanced: 1.2,
      expert: 1.5
    };
    
    const multiplier = difficultyMultiplier[preferences.difficulty as keyof typeof difficultyMultiplier] || 1;
    
    // Adjust difficulty in title
    let title = template.title;
    if (preferences.difficulty === 'beginner') {
      title = `Introductory ${title}`;
    } else if (preferences.difficulty === 'intermediate') {
      title = `Intermediate ${title}`;
    } else if (preferences.difficulty === 'advanced') {
      title = `Advanced ${title}`;
    } else if (preferences.difficulty === 'expert') {
      title = `Expert-Level ${title}`;
    }
    
    // Create learning path
    const learningPath = await storage.createLearningPath({
      title,
      description: template.description,
      category: preferences.category as any,
      difficulty: preferences.difficulty as any,
      estimatedDurationDays: preferences.durationDays,
      thumbnailUrl: null,
      isAiGenerated: false,
      createdByUserId: userId
    });
    
    // Create steps with adjusted complexity
    const steps: LearningPathStep[] = [];
    for (const stepTemplate of template.steps) {
      // Adjust time based on difficulty
      const estimatedMinutes = Math.round(stepTemplate.estimatedMinutes * multiplier);
      
      const step = await storage.createLearningPathStep({
        learningPathId: learningPath.id,
        title: stepTemplate.title,
        description: stepTemplate.description,
        order: stepTemplate.order,
        stepType: stepTemplate.stepType,
        content: stepTemplate.content,
        estimatedMinutes,
        resourceUrl: stepTemplate.resourceUrl
      });
      
      steps.push(step);
    }
    
    // Return the learning path with steps
    return {
      ...learningPath,
      steps
    };
  }

  // Add seedLearningPaths function
  storage.seedLearningPaths = function seedLearningPaths() {
    const seedData = async () => {
      // Example Learning Path 1: Emotional Intelligence Foundations
      const emotionalPath = await storage.createLearningPath({
        title: "Emotional Intelligence Foundations",
        description: "Develop fundamental skills in recognizing, understanding, and managing emotions in yourself and others.",
        category: "emotional" as any,
        difficulty: "beginner" as any,
        estimatedDurationDays: 14,
        thumbnailUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=500",
        isAiGenerated: false,
        createdByUserId: null
      });

      // Steps for Emotional Intelligence path
      await storage.createLearningPathStep({
        learningPathId: emotionalPath.id,
        title: "Understanding Emotions",
        description: "Learn about the basic emotions and how they affect your mind and body.",
        order: 1,
        stepType: "reading",
        content: "Emotions are complex psychological states that involve three distinct components: a subjective experience, a physiological response, and a behavioral or expressive response. In this step, we'll explore the six basic emotions as identified by psychologist Paul Ekman: happiness, sadness, fear, disgust, anger, and surprise.\n\nTake time to reflect on how each of these emotions feels in your body. Where do you physically feel anger? How does joy manifest physically? Understanding the physical sensations associated with emotions is the first step in developing emotional awareness.",
        estimatedMinutes: 30,
        resourceUrl: "https://www.verywellmind.com/what-are-emotions-2795178"
      });

      await storage.createLearningPathStep({
        learningPathId: emotionalPath.id,
        title: "Emotion Journal Practice",
        description: "Start a daily practice of tracking your emotions throughout the day.",
        order: 2,
        stepType: "exercise",
        content: "For this exercise, you'll need a notebook or digital document to create your emotion journal. Three times a day (morning, afternoon, and evening), pause and note:\n\n1. What emotion(s) are you feeling right now?\n2. What triggered this emotion?\n3. Rate the intensity from 1-10\n4. How did your body respond?\n5. What thoughts accompanied this emotion?\n\nAfter 3 days, review your journal and look for patterns. Are certain emotions triggered in specific contexts? Do particular people or situations consistently evoke strong emotional responses?",
        estimatedMinutes: 45,
        resourceUrl: null
      });

      await storage.createLearningPathStep({
        learningPathId: emotionalPath.id,
        title: "Emotional Regulation Techniques",
        description: "Learn and practice methods to regulate intense emotions.",
        order: 3,
        stepType: "video",
        content: "Emotional regulation is the ability to respond to experiences with a range of emotions in a manner that is socially acceptable yet sufficiently flexible to permit spontaneous reactions as well as the ability to delay spontaneous reactions when needed.\n\nIn this step, you'll learn several key techniques:\n\n1. Box Breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat.\n2. 5-4-3-2-1 Grounding: Identify 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste.\n3. Cognitive reframing: Challenge negative thought patterns.\n\nPractice each technique at least twice over the next two days.",
        estimatedMinutes: 60,
        resourceUrl: "https://www.youtube.com/watch?v=L1HCG3BGK8I"
      });

      // Example Learning Path 2: Cognitive Performance Optimization
      const cognitivePath = await storage.createLearningPath({
        title: "Cognitive Performance Optimization",
        description: "Enhance your mental capabilities by understanding and applying evidence-based techniques for memory, focus, and problem-solving.",
        category: "cognitive" as any,
        difficulty: "intermediate" as any,
        estimatedDurationDays: 21,
        thumbnailUrl: "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?q=80&w=500",
        isAiGenerated: false,
        createdByUserId: null
      });

      await storage.createLearningPathStep({
        learningPathId: cognitivePath.id,
        title: "The Science of Attention",
        description: "Understand how attention works and what factors affect your ability to focus.",
        order: 1,
        stepType: "reading",
        content: "Attention is the cognitive process of selectively concentrating on one aspect of the environment while ignoring other things. It is a limited resource, which is why multitasking is largely a myth - you're actually rapidly switching your attention between tasks rather than doing them simultaneously.\n\nIn this step, you'll learn about:\n\n1. The different types of attention: sustained, selective, divided, and executive attention\n2. How the prefrontal cortex manages your attention resources\n3. Common attention disruptors and their neurological impact\n4. The role of dopamine in maintaining focus\n\nUnderstanding these concepts will provide the foundation for improving your attention capacity.",
        estimatedMinutes: 40,
        resourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4287207/"
      });

      await storage.createLearningPathStep({
        learningPathId: cognitivePath.id,
        title: "Pomodoro Technique Practice",
        description: "Implement the Pomodoro technique to improve focus and productivity.",
        order: 2,
        stepType: "exercise",
        content: "The Pomodoro Technique is a time management method developed by Francesco Cirillo that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.\n\nFor this exercise:\n\n1. Choose a task you want to accomplish\n2. Set a timer for 25 minutes and focus exclusively on that task\n3. When the timer rings, take a 5-minute break\n4. After completing 4 Pomodoros, take a longer break (15-30 minutes)\n\nPractice this technique for at least 2 hours of work over the next 2 days. During each Pomodoro, note any distractions that arise without acting on them. At the end of each session, record your observations about your ability to maintain focus and what distractions were most tempting.",
        estimatedMinutes: 120,
        resourceUrl: "https://todoist.com/productivity-methods/pomodoro-technique"
      });

      return [emotionalPath, cognitivePath];
    };

    seedData()
      .then(paths => console.log(`Seeded ${paths.length} learning paths`))
      .catch(err => console.error('Error seeding learning paths:', err));
  };

  return storage;
}