import { Router, type Request, type Response } from "express";
import { db, usersTable, walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { SyncUserBody } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

router.get("/me", requireAuth, async (req: any, res: any): Promise<void> => {
  const user = req.currentUser;
  res.json(user);
});

router.post("/sync", async (req: any, res: any): Promise<void> => {
  const parsed = SyncUserBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { firebaseUid, email, displayName, photoUrl } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.firebaseUid, firebaseUid))
    .limit(1);

  let user;

  if (existing[0]) {
    const updated = await db
      .update(usersTable)
      .set({
        email,
        displayName,
        photoUrl: photoUrl ?? null,
      })
      .where(eq(usersTable.firebaseUid, firebaseUid))
      .returning();

    user = updated[0];
  } else {
    const inserted = await db
      .insert(usersTable)
      .values({
        firebaseUid,
        email,
        displayName,
        photoUrl: photoUrl ?? null,
      })
      .returning();

    user = inserted[0];

    await db
      .insert(walletsTable)
      .values({
        userId: user.id,
        balance: 0,
      })
      .onConflictDoNothing();
  }

  res.json(user);
});

const FfUpdateBody = z.object({
  freeFireUid: z.string().optional(),
  freeFireName: z.string().optional(),
});

router.patch(
  "/me/ff",
  requireAuth,
  async (req: any, res: any): Promise<void> => {
    const parsed = FfUpdateBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    const user = req.currentUser;

    const updated = await db
      .update(usersTable)
      .set({
        freeFireUid: parsed.data.freeFireUid,
        freeFireName: parsed.data.freeFireName,
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    res.json(updated[0]);
  },
);

export default router;
