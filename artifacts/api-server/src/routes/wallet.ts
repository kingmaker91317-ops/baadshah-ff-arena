import { Router } from "express";
import { db, walletsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { RechargeWalletBody } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  if (!wallet[0]) {
    // Auto-create wallet if missing
    const created = await db.insert(walletsTable).values({ userId: user.id, balance: 0 }).returning();
    res.json(created[0]);
    return;
  }
  res.json(wallet[0]);
});

router.get("/transactions", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(transactionsTable.createdAt);
  res.json(rows.reverse());
});

router.post("/recharge", requireAuth, async (req, res) => {
  const parsed = RechargeWalletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const user = (req as any).currentUser;
  const { amount, utrNumber } = parsed.data;

  const tx = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "recharge",
    amount,
    status: "pending",
    utrNumber,
    description: "Wallet recharge request",
  }).returning();

  res.status(201).json(tx[0]);
});

export default router;
