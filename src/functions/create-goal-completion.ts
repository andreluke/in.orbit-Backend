import { count, and, gte, lte, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { goals, goalsCompletions } from "../db/schema";
import dayjs from "dayjs";

interface CreateGoalCompletionRequest {
  goalId: string;
}

export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf("week").toDate();
  const lastDayOfWeek = dayjs().endOf("week").toDate();

  const goalCompletionCount = db.$with("goal_completion_counts").as(
    db
      .select({
        goalId: goalsCompletions.goalId,
        completionCount: count(goalsCompletions.id).as("completionCount"),
      })
      .from(goalsCompletions)
      .where(
        and(
          gte(goalsCompletions.createdAt, firstDayOfWeek),
          lte(goalsCompletions.createdAt, lastDayOfWeek),
          eq(goalsCompletions.goalId, goalId)
        )
      )
      .groupBy(goalsCompletions.goalId)
  );
  const result = await db
    .with(goalCompletionCount)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql/*sql*/ `
      COALESCE(${goalCompletionCount.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalCompletionCount, eq(goalCompletionCount.goalId, goals.id))
    .where(eq(goalCompletionCount.goalId, goalId))
    .limit(1);

  const { completionCount, desiredWeeklyFrequency } = result[0];

  if (completionCount >= desiredWeeklyFrequency) {
    throw new Error("Goal already completed this week!");
  }

  const insertResult = await db
    .insert(goalsCompletions)
    .values({ goalId })
    .returning();
  const goalCompletion = insertResult[0];

  return {
    goalCompletion,
  };
}
