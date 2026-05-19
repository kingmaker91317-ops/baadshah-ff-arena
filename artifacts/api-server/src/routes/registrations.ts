import { Router } from "express";
import { db, registrationsTable, tournamentsTable, walletsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  RegisterForTournamentBody,
  RegisterForTournamentParams,
  GetTournamentRegistrationsParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/my", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const rows = await db.select().from(registrationsTable).where(eq(registrationsTable.userId, user.id));

  const result = await Promise.all(
    rows.map(async (reg) => {
      const tournament = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, reg.tournamentId)).limit(1);
      return { ...reg, tournament: tournament[0] ?? null, user };
    })
  );

  res.json(result);
});

router.post("/:id/register", requireAuth, async (req, res) => {
  const paramsParsed = RegisterForTournamentParams.safeParse(req.params);
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = RegisterForTournamentBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const user = (req as any).currentUser;
  const tournamentId = paramsParsed.data.id;

  const tournament = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId)).limit(1);
  if (!tournament[0]) { res.status(404).json({ error: "Tournament not found" }); return; }
  const t = tournament[0];

  if (t.filledSlots >= t.maxSlots) {
    res.status(400).json({ error: "Tournament is full" });
    return;
  }

  const existing = await db.select().from(registrationsTable).where(
    and(eq(registrationsTable.userId, user.id), eq(registrationsTable.tournamentId, tournamentId))
  ).limit(1);
  if (existing[0]) { res.status(400).json({ error: "Already registered" }); return; }

  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  if (!wallet[0] || wallet[0].balance < t.entryFee) {
    res.status(400).json({ error: "Insufficient wallet balance" });
    return;
  }

  // Deduct entry fee
  await db.update(walletsTable).set({ balance: wallet[0].balance - t.entryFee }).where(eq(walletsTable.userId, user.id));

  // Record transaction
  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "deduction",
    amount: t.entryFee,
    status: "completed",
    description: `Entry fee for ${t.title}`,
  });

  // Update filled slots
  await db.update(tournamentsTable).set({ filledSlots: t.filledSlots + 1 }).where(eq(tournamentsTable.id, tournamentId));

  // Create registration
  const reg = await db.insert(registrationsTable).values({
    userId: user.id,
    tournamentId,
    freeFireUid: bodyParsed.data.freeFireUid,
    freeFireName: bodyParsed.data.freeFireName,
    teamName: bodyParsed.data.teamName ?? null,
  }).returning();

  res.status(201).json({ ...reg[0], tournament: t, user });
});

router.get("/:id/registrations", requireAdmin, async (req, res) => {
  const parsed = GetTournamentRegistrationsParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(registrationsTable).where(eq(registrationsTable.tournamentId, parsed.data.id));

  const result = await Promise.all(
    rows.map(async (reg) => {
      const u = await db.select().from(usersTable).where(eq(usersTable.id, reg.userId)).limit(1);
      const t = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, reg.tournamentId)).limit(1);
      return { ...reg, user: u[0] ?? null, tournament: t[0] ?? null };
    })
  );

  res.json(result);
});

export default router;
