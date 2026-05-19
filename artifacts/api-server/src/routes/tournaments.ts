import { Router } from "express";
import { db, tournamentsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  CreateTournamentBody,
  UpdateTournamentBody,
  UpdateTournamentParams,
  GetTournamentParams,
  DeleteTournamentParams,
  SetRoomDetailsBody,
  SetRoomDetailsParams,
  ListTournamentsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/stats", async (_req, res) => {
  const rows = await db.select().from(tournamentsTable);
  const totalPrizePool = rows.reduce((sum, t) => sum + t.prizePool, 0);
  const upcomingCount = rows.filter((t) => t.status === "upcoming").length;
  const liveCount = rows.filter((t) => t.status === "live").length;
  res.json({
    totalTournaments: rows.length,
    upcomingCount,
    liveCount,
    totalPrizePool,
  });
});

router.get("/", async (req, res) => {
  const parsed = ListTournamentsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const conditions = [];
  if (params.status) conditions.push(eq(tournamentsTable.status, params.status));
  if (params.mode) conditions.push(eq(tournamentsTable.mode, params.mode));

  const rows =
    conditions.length > 0
      ? await db.select().from(tournamentsTable).where(and(...conditions)).orderBy(sql`${tournamentsTable.scheduledAt} asc`)
      : await db.select().from(tournamentsTable).orderBy(sql`${tournamentsTable.scheduledAt} asc`);

  res.json(rows);
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { title, description, mode, prizePool, entryFee, maxSlots, scheduledAt, mapName } = parsed.data;
  const inserted = await db
    .insert(tournamentsTable)
    .values({
      title,
      description: description ?? null,
      mode,
      prizePool,
      entryFee,
      maxSlots,
      scheduledAt: new Date(scheduledAt),
      mapName: mapName ?? null,
    })
    .returning();
  res.status(201).json(inserted[0]);
});

router.get("/:id", async (req, res) => {
  const parsed = GetTournamentParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const row = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, parsed.data.id)).limit(1);
  if (!row[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row[0]);
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const paramsParsed = UpdateTournamentParams.safeParse(req.params);
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateTournamentBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const updates: Record<string, unknown> = {};
  const b = bodyParsed.data;
  if (b.title !== undefined) updates.title = b.title;
  if (b.description !== undefined) updates.description = b.description;
  if (b.status !== undefined) updates.status = b.status;
  if (b.prizePool !== undefined) updates.prizePool = b.prizePool;
  if (b.entryFee !== undefined) updates.entryFee = b.entryFee;
  if (b.maxSlots !== undefined) updates.maxSlots = b.maxSlots;
  if (b.scheduledAt !== undefined) updates.scheduledAt = new Date(b.scheduledAt);
  if (b.mapName !== undefined) updates.mapName = b.mapName;

  const updated = await db.update(tournamentsTable).set(updates).where(eq(tournamentsTable.id, paramsParsed.data.id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteTournamentParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(tournamentsTable).where(eq(tournamentsTable.id, parsed.data.id));
  res.status(204).send();
});

router.patch("/:id/room", requireAdmin, async (req, res) => {
  const paramsParsed = SetRoomDetailsParams.safeParse(req.params);
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = SetRoomDetailsBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const updated = await db
    .update(tournamentsTable)
    .set({ roomId: bodyParsed.data.roomId, roomPassword: bodyParsed.data.roomPassword })
    .where(eq(tournamentsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

export default router;
