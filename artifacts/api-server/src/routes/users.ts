import { Router } from "express";

const router = Router();

router.get("/me", async (req: any, res: any) => {
  res.json({
    success: true,
    message: "User route working",
  });
});

export default router;
