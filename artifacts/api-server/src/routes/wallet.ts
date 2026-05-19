import { Router } from "express";
import { db, walletsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { RechargeWalletBody } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  if (!wallet[0]) {
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
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const user = (req as any).currentUser;
  const { amount, utrNumber } = parsed.data;
  const screenshotUrl = req.body.screenshotUrl ?? null;

  const tx = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "recharge",
    amount,
    status: "pending",
    utrNumber,
    description: "Wallet recharge request",
  }).returning();

  // Store screenshot URL in the new column if present
  if (screenshotUrl && tx[0]) {
    await db.execute(`UPDATE transactions SET screenshot_url = $1 WHERE id = $2`, [screenshotUrl, tx[0].id] as any);
  }

  res.status(201).json(tx[0]);
});

router.post("/withdraw", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const parsed = z.object({
    amount: z.number().int().positive(),
    upiId: z.string().min(1),
    notes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const { amount, upiId, notes } = parsed.data;

  // Check balance
  const wallet = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id)).limit(1);
  const balance = wallet[0]?.balance ?? 0;
  if (balance < amount) { res.status(400).json({ error: "Insufficient balance" }); return; }

  // Deduct immediately (hold funds)
  await db.update(walletsTable).set({ balance: balance - amount }).where(eq(walletsTable.userId, user.id));

  const tx = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "withdrawal",
    amount,
    status: "pending",
    description: `Withdrawal to UPI: ${upiId}${notes ? " — " + notes : ""}`,
  }).returning();

  res.status(201).json(tx[0]);
});

export default router;
