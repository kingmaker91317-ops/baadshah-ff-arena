import { Router } from "express";
import { db, transactionsTable, walletsTable, usersTable, tournamentsTable, registrationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { ApproveRechargeParams, RejectRechargeParams } from "@workspace/api-zod";

const router = Router();

router.get("/stats", requireAdmin, async (_req, res) => {
  const [users, tournaments, registrations, transactions] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(tournamentsTable),
    db.select().from(registrationsTable),
    db.select().from(transactionsTable),
  ]);

  const activeTournaments = tournaments.filter((t) => t.status === "live" || t.status === "upcoming").length;
  const pendingRecharges = transactions.filter((tx) => tx.type === "recharge" && tx.status === "pending").length;
  const totalRevenue = transactions
    .filter((tx) => tx.type === "deduction" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  res.json({
    totalUsers: users.length,
    totalTournaments: tournaments.length,
    activeTournaments,
    totalRegistrations: registrations.length,
    pendingRecharges,
    totalRevenue,
  });
});

router.get("/recharge-requests", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "recharge"), eq(transactionsTable.status, "pending")))
    .orderBy(transactionsTable.createdAt);
  res.json(rows.reverse());
});

router.post("/recharge-requests/:id/approve", requireAdmin, async (req, res) => {
  const parsed = ApproveRechargeParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const tx = await db.select().from(transactionsTable).where(eq(transactionsTable.id, parsed.data.id)).limit(1);
  if (!tx[0]) { res.status(404).json({ error: "Not found" }); return; }
  if (tx[0].status !== "pending") { res.status(400).json({ error: "Already processed" }); return; }

  // Update transaction status
  const updated = await db.update(transactionsTable)
    .set({ status: "completed" })
    .where(eq(transactionsTable.id, parsed.data.id))
    .returning();

  // Credit wallet
  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, tx[0].userId)).limit(1);
  if (wallet[0]) {
    await db.update(walletsTable)
      .set({ balance: wallet[0].balance + tx[0].amount })
      .where(eq(walletsTable.userId, tx[0].userId));
  } else {
    await db.insert(walletsTable).values({ userId: tx[0].userId, balance: tx[0].amount });
  }

  res.json(updated[0]);
});

router.post("/recharge-requests/:id/reject", requireAdmin, async (req, res) => {
  const parsed = RejectRechargeParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const updated = await db.update(transactionsTable)
    .set({ status: "rejected" })
    .where(eq(transactionsTable.id, parsed.data.id))
    .returning();

  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

export default router;
