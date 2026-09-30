import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const progress = sqliteTable('learning_progress', {userId: text('user_id').primaryKey(), lastMission: text('last_mission').notNull(), updatedAt: integer('updated_at').notNull()});
export const completedMissions = sqliteTable('completed_missions', {userId:text('user_id').notNull(), missionId:text('mission_id').notNull(), completedAt:integer('completed_at').notNull()}, table => [primaryKey({columns:[table.userId, table.missionId]})]);
