import { z } from "zod";
import { pgTable, text, integer, timestamp, boolean, serial, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Learning Path difficulty levels
export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced", "expert"]);

// Learning Path categories
export const categoryEnum = pgEnum("category", [
  "cognitive",
  "emotional",
  "physical",
  "social",
  "professional",
  "spiritual"
]);

// Learning Path status
export const statusEnum = pgEnum("status", ["not_started", "in_progress", "completed", "paused"]);

// Learning paths table
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  estimatedDurationDays: integer("estimated_duration_days").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
  createdByUserId: integer("created_by_user_id"),
});

// Learning path steps table
export const learningPathSteps = pgTable("learning_path_steps", {
  id: serial("id").primaryKey(),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  stepType: text("step_type").notNull(), // "reading", "exercise", "reflection", "assessment", etc.
  content: text("content").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  resourceUrl: text("resource_url"),
});

// User learning paths table (enrollment and progress)
export const userLearningPaths = pgTable("user_learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  currentStepId: integer("current_step_id").references(() => learningPathSteps.id),
  status: statusEnum("status").default("not_started").notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});

// User step completion tracking
export const userStepCompletions = pgTable("user_step_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stepId: integer("step_id").notNull().references(() => learningPathSteps.id),
  userLearningPathId: integer("user_learning_path_id").notNull().references(() => userLearningPaths.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  notes: text("notes"),
  rating: integer("rating"), // User rating of this step (1-5)
});

// Zod schemas for validation
export const insertLearningPathSchema = createInsertSchema(learningPaths).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  estimatedDurationDays: true,
  thumbnailUrl: true,
  isAiGenerated: true,
  createdByUserId: true,
});

export const insertLearningPathStepSchema = createInsertSchema(learningPathSteps).pick({
  learningPathId: true,
  title: true,
  description: true,
  order: true,
  stepType: true,
  content: true,
  estimatedMinutes: true,
  resourceUrl: true,
});

export const insertUserLearningPathSchema = createInsertSchema(userLearningPaths).pick({
  userId: true,
  learningPathId: true,
  currentStepId: true,
  status: true,
  progressPercent: true,
});

export const insertUserStepCompletionSchema = createInsertSchema(userStepCompletions).pick({
  userId: true,
  stepId: true,
  userLearningPathId: true,
  notes: true,
  rating: true,
});

// TypeScript types
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;

export type InsertLearningPathStep = z.infer<typeof insertLearningPathStepSchema>;
export type LearningPathStep = typeof learningPathSteps.$inferSelect;

export type InsertUserLearningPath = z.infer<typeof insertUserLearningPathSchema>;
export type UserLearningPath = typeof userLearningPaths.$inferSelect;

export type InsertUserStepCompletion = z.infer<typeof insertUserStepCompletionSchema>;
export type UserStepCompletion = typeof userStepCompletions.$inferSelect;

// Learning path with steps included
export interface LearningPathWithSteps extends LearningPath {
  steps: LearningPathStep[];
}

// User learning path with path and step data
export interface UserLearningPathDetail extends UserLearningPath {
  learningPath: LearningPathWithSteps;
  completedSteps: UserStepCompletion[];
}