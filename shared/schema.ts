import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  isPremium: boolean("is_premium").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  avatar: true,
  bio: true,
});

// Goal model
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "career", "personal", "educational"
  progress: integer("progress").default(0).notNull(),
  deadline: timestamp("deadline"),
  priority: text("priority").default("medium").notNull(), // "low", "medium", "high"
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  description: true,
  category: true,
  progress: true,
  deadline: true,
  priority: true,
  isCompleted: true,
});

// Assessment model
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  questions: json("questions").notNull(),
  category: text("category").notNull(), // "leadership", "emotional_intelligence", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  description: true,
  duration: true,
  questions: true,
  category: true,
});

// UserAssessment model (to store assessment results)
export const userAssessments = pgTable("user_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentId: integer("assessment_id").notNull(),
  score: integer("score").notNull(),
  results: json("results").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertUserAssessmentSchema = createInsertSchema(userAssessments).pick({
  userId: true,
  assessmentId: true,
  score: true,
  results: true,
});

// Challenge type enum
export const challengeTypeEnum = pgEnum("challenge_type", ["individual", "collaborative"]);

// Challenge model
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  challengeType: challengeTypeEnum("challenge_type").default("individual").notNull(),
  duration: integer("duration").notNull(), // in days
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  maxParticipants: integer("max_participants"), // Only for collaborative challenges
  currentParticipants: integer("current_participants").default(0), // Only for collaborative challenges
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  category: true,
  challengeType: true,
  duration: true,
  startDate: true,
  endDate: true,
  createdBy: true,
  maxParticipants: true,
  currentParticipants: true,
});

// UserChallenge model (to track user participation in challenges)
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  challengeId: integer("challenge_id").notNull(),
  progress: integer("progress").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).pick({
  userId: true,
  challengeId: true,
  progress: true,
  isCompleted: true,
});

// Growth model (to track user's weekly growth)
export const growth = pgTable("growth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  value: decimal("value").notNull(),
  category: text("category").notNull(), // "overall", "career", "personal", "educational"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGrowthSchema = createInsertSchema(growth).pick({
  userId: true,
  date: true,
  value: true,
  category: true,
});

// Challenge messages for collaborative challenges
export const challengeMessages = pgTable("challenge_messages", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChallengeMessageSchema = createInsertSchema(challengeMessages).pick({
  challengeId: true,
  userId: true,
  content: true,
});

// Challenge activity events for real-time updates
export const challengeActivityEnum = pgEnum("challenge_activity_type", [
  "join", "leave", "progress_update", "complete", "message", "milestone"
]);

export const challengeActivities = pgTable("challenge_activities", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  userId: integer("user_id").notNull(),
  activityType: challengeActivityEnum("activity_type").notNull(),
  data: json("data"), // Flexible JSON data structure based on activity type
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChallengeActivitySchema = createInsertSchema(challengeActivities).pick({
  challengeId: true,
  userId: true,
  activityType: true,
  data: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertUserAssessment = z.infer<typeof insertUserAssessmentSchema>;
export type UserAssessment = typeof userAssessments.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertGrowth = z.infer<typeof insertGrowthSchema>;
export type Growth = typeof growth.$inferSelect;
export type InsertChallengeMessage = z.infer<typeof insertChallengeMessageSchema>;
export type ChallengeMessage = typeof challengeMessages.$inferSelect;
export type InsertChallengeActivity = z.infer<typeof insertChallengeActivitySchema>;
export type ChallengeActivity = typeof challengeActivities.$inferSelect;
