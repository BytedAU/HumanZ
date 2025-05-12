import { MemStorage } from './storage';
import { OpenAI } from 'openai';
import {
  LearningPath,
  LearningPathStep,
  InsertLearningPath,
  InsertLearningPathStep,
  LearningPathWithSteps
} from '@shared/learning-path-schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

// Generates a personalized learning path using OpenAI's GPT
export async function generateAILearningPath(
  userId: number,
  preferences: {
    category: string;
    difficulty: string;
    focusAreas: string[];
    durationDays: number;
  },
  storage: MemStorage
): Promise<LearningPathWithSteps> {
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
    throw new Error('Failed to generate learning path. Please try again later.');
  }
}

// Create sample learning paths for testing
export function seedLearningPaths(storage: MemStorage) {
  const seedData = async () => {
    // Example Learning Path 1: Emotional Intelligence Foundations
    const emotionalPath = await storage.createLearningPath({
      title: "Emotional Intelligence Foundations",
      description: "Develop fundamental skills in recognizing, understanding, and managing emotions in yourself and others.",
      category: "emotional",
      difficulty: "beginner",
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
      category: "cognitive",
      difficulty: "intermediate",
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
}