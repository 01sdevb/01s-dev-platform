import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const siteVisitsTable = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  sessionKey: text("session_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});
