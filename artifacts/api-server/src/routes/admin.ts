import { Router } from "express";
import {
  db, transactionsTable, walletsTable, usersTable,
  tournamentsTable, registrationsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats", requireAdmin, async (_req, res) => {
  const [users, tournaments, registrations, transactions] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(tournamentsTable),
    db.select().from(registrationsTable),
    db.select().from(transactionsTable),
  ]);
  const activeTournaments = tournaments.filter((t) => t.status === "live" || t.status === "upcoming").length;
  const pendingRecharges = transactions.filter((tx) => tx.type === "recharge" && tx.status === "pending").length;
  const pendingWithdrawals = transactions.filter((tx) => tx.type === "withdrawal" && tx.status === "pending").length;
  const totalRevenue = transactions
    .filter((tx) => tx.type === "deduction" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);
  res.json({
    totalUsers: users.length,
    totalTournaments: tournaments.length,
    activeTournaments,
    totalRegistrations: registrations.length,
    pendingRecharges,
    pendingWithdrawals,
    totalRevenue,
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const wallets = await db.select().from(walletsTable);
  const walletMap = new Map(wallets.map((w) => [w.userId, w.balance]));
  res.json(users.map((u) => ({ ...u, walletBalance: walletMap.get(u.id) ?? 0 })));
});

router.post("/users/:id/credit", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = z.object({ amount: z.number().int().positive(), notes: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { amount, notes } = parsed.data;

  await db.insert(transactionsTable).values({
    userId: id, type: "recharge", amount, status: "completed",
    description: notes || "Admin credit",
  });

  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, id)).limit(1);
  if (wallet[0]) {
    await db.update(walletsTable).set({ balance: wallet[0].balance + amount }).where(eq(walletsTable.userId, id));
  } else {
    await db.insert(walletsTable).values({ userId: id, balance: amount });
  }
  res.json({ ok: true });
});

router.patch("/users/:id/admin", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = z.object({ isAdmin: z.boolean() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const updated = await db.update(usersTable).set({ isAdmin: parsed.data.isAdmin }).where(eq(usersTable.id, id)).returning();
  res.json(updated[0]);
});

// ─── Winner Selection ─────────────────────────────────────────────────────────
router.post("/tournaments/:id/winner", requireAdmin, async (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const parsed = z.object({ registrationId: z.number().int(), prizeAmount: z.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { registrationId, prizeAmount } = parsed.data;

  // Get registration
  const reg = await db.select().from(registrationsTable).where(eq(registrationsTable.id, registrationId)).limit(1);
  if (!reg[0]) { res.status(404).json({ error: "Registration not found" }); return; }

  // Update tournament with winner
  await db.update(tournamentsTable).set({ winnerUserId: reg[0].userId }).where(eq(tournamentsTable.id, tournamentId));

  // Credit prize to winner wallet
  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, reg[0].userId)).limit(1);
  if (wallet[0]) {
    await db.update(walletsTable).set({ balance: wallet[0].balance + prizeAmount }).where(eq(walletsTable.userId, reg[0].userId));
  } else {
    await db.insert(walletsTable).values({ userId: reg[0].userId, balance: prizeAmount });
  }

  // Record prize transaction
  await db.insert(transactionsTable).values({
    userId: reg[0].userId, type: "recharge", amount: prizeAmount,
    status: "completed", description: `Tournament prize — ${reg[0].freeFireName}`,
  });

  res.json({ ok: true, winnerId: reg[0].userId, prizeAmount });
});

// ─── Recharge Requests ────────────────────────────────────────────────────────
router.get("/recharge-requests", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      userId: transactionsTable.userId,
      amount: transactionsTable.amount,
      status: transactionsTable.status,
      utrNumber: transactionsTable.utrNumber,
      screenshotUrl: (transactionsTable as any).screenshotUrl,
      notes: (transactionsTable as any).notes,
      createdAt: transactionsTable.createdAt,
      userName: usersTable.displayName,
      userEmail: usersTable.email,
    })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(and(eq(transactionsTable.type, "recharge"), eq(transactionsTable.status, "pending")))
    .orderBy(transactionsTable.createdAt);
  res.json(rows.reverse());
});

router.post("/recharge-requests/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const tx = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
  if (!tx[0]) { res.status(404).json({ error: "Not found" }); return; }
  if (tx[0].status !== "pending") { res.status(400).json({ error: "Already processed" }); return; }

  await db.update(transactionsTable).set({ status: "completed" }).where(eq(transactionsTable.id, id));

  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx[0].userId)).limit(1);
  if (wallet[0]) {
    await db.update(walletsTable).set({ balance: wallet[0].balance + tx[0].amount }).where(eq(walletsTable.userId, tx[0].userId));
  } else {
    await db.insert(walletsTable).values({ userId: tx[0].userId, balance: tx[0].amount });
  }
  res.json({ ok: true });
});

router.post("/recharge-requests/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const updated = await db.update(transactionsTable).set({ status: "rejected" }).where(eq(transactionsTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ok: true });
});

// ─── Withdraw Requests ────────────────────────────────────────────────────────
router.get("/withdraw-requests", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      userId: transactionsTable.userId,
      amount: transactionsTable.amount,
      status: transactionsTable.status,
      notes: (transactionsTable as any).notes,
      createdAt: transactionsTable.createdAt,
      userName: usersTable.displayName,
      userEmail: usersTable.email,
    })
    .from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(transactionsTable.type, "withdrawal"))
    .orderBy(transactionsTable.createdAt);
  res.json(rows.reverse());
});

router.post("/withdraw-requests/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const tx = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
  if (!tx[0]) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(transactionsTable).set({ status: "completed" }).where(eq(transactionsTable.id, id));
  res.json({ ok: true });
});

router.post("/withdraw-requests/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const tx = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
  if (!tx[0]) { res.status(404).json({ error: "Not found" }); return; }

  // Refund coins if status was pending
  if (tx[0].status === "pending") {
    const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx[0].userId)).limit(1);
    if (wallet[0]) {
      await db.update(walletsTable).set({ balance: wallet[0].balance + tx[0].amount }).where(eq(walletsTable.userId, tx[0].userId));
    }
  }
  await db.update(transactionsTable).set({ status: "rejected" }).where(eq(transactionsTable.id, id));
  res.json({ ok: true });
});

export default router;
