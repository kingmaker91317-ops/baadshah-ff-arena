import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  mode: text("mode").notNull(), // solo | duo | squad
  status: text("status").notNull().default("upcoming"), // upcoming | live | completed
  prizePool: integer("prize_pool").notNull(),
  entryFee: integer("entry_fee").notNull(),
  maxSlots: integer("max_slots").notNull(),
  filledSlots: integer("filled_slots").notNull().default(0),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  roomId: text("room_id"),
  roomPassword: text("room_password"),
  mapName: text("map_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({ id: true, createdAt: true, updatedAt: true, filledSlots: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;
