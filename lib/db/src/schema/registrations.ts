import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { tournamentsTable } from "./tournaments";

export const registrationsTable = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  tournamentId: integer("tournament_id").notNull().references(() => tournamentsTable.id),
  freeFireUid: text("free_fire_uid").notNull(),
  freeFireName: text("free_fire_name").notNull(),
  teamName: text("team_name"),
  status: text("status").notNull().default("confirmed"), // confirmed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("unique_user_tournament").on(t.userId, t.tournamentId),
]);

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({ id: true, createdAt: true });
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;
