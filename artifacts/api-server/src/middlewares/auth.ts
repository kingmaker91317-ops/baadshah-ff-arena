import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const firebaseUid = req.headers["x-firebase-uid"] as string | undefined;
  if (!firebaseUid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.firebaseUid, firebaseUid)).limit(1);
  if (!user[0]) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  (req as any).currentUser = user[0];
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    const user = (req as any).currentUser;
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
