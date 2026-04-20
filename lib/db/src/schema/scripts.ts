import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  code: text("code").notNull(),
  game: text("game").notNull(),
  category: text("category").notNull().default("GUI"),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  likes: integer("likes").notNull().default(0),
  views: integer("views").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({ id: true, createdAt: true, updatedAt: true, likes: true, views: true, isVerified: true, isPremium: true });
export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;
