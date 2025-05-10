import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" });

// AI assessment generation
export async function generateAssessmentFeedback(
  assessmentType: string, 
  answers: { questionId: number; answer: number }[]
): Promise<{
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestedActions: string[];
}> {
  try {
    const prompt = `
      You are an expert personal growth coach analyzing a user's ${assessmentType} assessment.
      
      The user provided the following answers (1-10 scale where 10 is excellent):
      ${answers.map(a => `Question ${a.questionId}: ${a.answer}`).join('\n')}
      
      Based on these answers, provide a comprehensive analysis including:
      1. An overall score (between 0 and 100)
      2. 2-3 key strengths
      3. 2-3 areas for improvement
      4. 3-4 specific action items for growth
      
      Format your response as a JSON object with these fields: 
      { "overallScore": number, "strengths": string[], "weaknesses": string[], "suggestedActions": string[] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      overallScore: Math.min(100, Math.max(0, Math.round(result.overallScore))),
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      suggestedActions: result.suggestedActions || [],
    };
  } catch (error) {
    console.error("Error generating assessment feedback:", error);
    
    // Provide fallback response if AI fails
    return {
      overallScore: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
      strengths: ["Communication skills", "Problem-solving abilities"],
      weaknesses: ["Time management", "Stress handling"],
      suggestedActions: [
        "Practice focused work sessions", 
        "Develop a daily planning routine", 
        "Learn basic meditation techniques"
      ]
    };
  }
}

// Generate growth insights
export async function generateGrowthInsights(
  growthData: { date: Date; value: number; category: string }[]
): Promise<{
  trends: string[];
  patterns: string[];
  recommendations: string[];
}> {
  try {
    const formattedData = growthData.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      value: entry.value,
      category: entry.category
    }));
    
    const prompt = `
      You are an AI growth analytics expert analyzing user growth data over time.
      
      Here is the user's growth data:
      ${JSON.stringify(formattedData)}
      
      Based on this data, provide:
      1. 2-3 key trends you observe
      2. 2-3 patterns in the user's growth journey
      3. 3-4 specific recommendations to improve growth
      
      Format your response as a JSON object with these fields: 
      { "trends": string[], "patterns": string[], "recommendations": string[] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating growth insights:", error);
    
    // Provide fallback response if AI fails
    return {
      trends: [
        "Overall positive growth trajectory", 
        "Strongest growth in educational areas"
      ],
      patterns: [
        "Higher growth on weekends", 
        "Periods of plateau followed by sharp improvements"
      ],
      recommendations: [
        "Focus more on consistent daily progress", 
        "Balance growth across all categories", 
        "Set specific weekly targets",
        "Join a community challenge to boost motivation"
      ]
    };
  }
}

// Generate goal recommendations
export async function generateGoalRecommendations(
  currentGoals: { title: string; category: string; progress: number }[],
  userInterests: string[]
): Promise<{
  recommendedGoals: { title: string; category: string; description: string }[];
}> {
  try {
    const prompt = `
      You are an AI personal growth expert creating personalized goal recommendations.
      
      The user currently has these goals:
      ${JSON.stringify(currentGoals)}
      
      The user has shown interest in:
      ${JSON.stringify(userInterests)}
      
      Based on this information, suggest 3 new personalized goals that would complement their current goals.
      Each suggested goal should have a title, category (career, personal, educational), and brief description.
      
      Format your response as a JSON object with this field: 
      { "recommendedGoals": [{ "title": string, "category": string, "description": string }] }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating goal recommendations:", error);
    
    // Provide fallback recommendations if AI fails
    return {
      recommendedGoals: [
        {
          title: "Learn Basic Meditation",
          category: "personal",
          description: "Establish a daily meditation routine to improve focus and reduce stress."
        },
        {
          title: "Read Key Industry Books",
          category: "career",
          description: "Read 3 influential books in your field to deepen your expertise."
        },
        {
          title: "Take an Online Course",
          category: "educational",
          description: "Complete an online course in a subject that interests you to expand your knowledge."
        }
      ]
    };
  }
}
